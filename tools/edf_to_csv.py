#!/usr/bin/env python3
"""Convert an EDF file to a single-channel CSV the EEG Analyzer app can load.

EDF (European Data Format) is a simple binary format: a 256-byte ASCII main
header, then per-signal ASCII headers, then interleaved data records of
16-bit little-endian signed integers. This script needs no third-party
libraries.

Usage:
    python3 edf_to_csv.py INPUT.edf [OUTPUT.csv] [--channel "EEG Fpz-Cz"]

The output CSV has a single `value` column (physical units, e.g. uV), which is
exactly what the app's /api/eeg/load-csv endpoint expects.
"""
import argparse
import struct
import sys


def read_header(f):
    f.seek(0)
    main = f.read(256)
    n_data_records = int(main[236:244])
    record_duration = float(main[244:252])
    ns = int(main[252:256])

    def field(width):
        return [f.read(width).decode("ascii", "replace").strip() for _ in range(ns)]

    labels = field(16)
    _transducers = field(80)
    _phys_dim = field(8)
    phys_min = [float(x) for x in field(8)]
    phys_max = [float(x) for x in field(8)]
    dig_min = [float(x) for x in field(8)]
    dig_max = [float(x) for x in field(8)]
    _prefilter = field(80)
    samples_per_record = [int(x) for x in field(8)]
    # remaining ns*32 reserved bytes are skipped implicitly by data seek

    return {
        "n_data_records": n_data_records,
        "record_duration": record_duration,
        "ns": ns,
        "labels": labels,
        "phys_min": phys_min,
        "phys_max": phys_max,
        "dig_min": dig_min,
        "dig_max": dig_max,
        "samples_per_record": samples_per_record,
        "header_bytes": 256 + ns * 256,
    }


def extract(path, channel):
    with open(path, "rb") as f:
        h = read_header(f)

        # pick the channel index (exact match, else case-insensitive contains)
        labels = h["labels"]
        if channel in labels:
            idx = labels.index(channel)
        else:
            matches = [i for i, l in enumerate(labels) if channel.lower() in l.lower()]
            if not matches:
                sys.exit(
                    f"Channel {channel!r} not found. Available: {labels}"
                )
            idx = matches[0]

        spr = h["samples_per_record"]
        dmin, dmax = h["dig_min"][idx], h["dig_max"][idx]
        pmin, pmax = h["phys_min"][idx], h["phys_max"][idx]
        scale = (pmax - pmin) / (dmax - dmin)
        record_size = sum(spr)  # samples across all signals per data record
        before = sum(spr[:idx])  # samples before our channel in each record
        n_here = spr[idx]

        sampling_rate = n_here / h["record_duration"]

        f.seek(h["header_bytes"])
        values = []
        for _ in range(h["n_data_records"]):
            rec = f.read(record_size * 2)
            if len(rec) < record_size * 2:
                break  # truncated final record
            ints = struct.unpack(f"<{record_size}h", rec)
            chunk = ints[before:before + n_here]
            values.extend((v - dmin) * scale + pmin for v in chunk)

        return labels[idx], sampling_rate, values


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("input")
    ap.add_argument("output", nargs="?")
    ap.add_argument("--channel", default="EEG Fpz-Cz",
                    help="signal label to extract (default: 'EEG Fpz-Cz')")
    ap.add_argument("--list", action="store_true",
                    help="just list available channels and exit")
    args = ap.parse_args()

    if args.list:
        with open(args.input, "rb") as f:
            h = read_header(f)
        for i, l in enumerate(h["labels"]):
            rate = h["samples_per_record"][i] / h["record_duration"]
            print(f"  [{i}] {l!r:24} {rate:g} Hz")
        return

    out = args.output or args.input.rsplit(".", 1)[0] + ".csv"
    label, rate, values = extract(args.input, args.channel)

    with open(out, "w") as f:
        f.write("value\n")
        for v in values:
            f.write(f"{v:.6f}\n")

    print(f"Channel : {label}")
    print(f"Rate    : {rate:g} Hz")
    print(f"Samples : {len(values)} ({len(values)/rate/3600:.2f} h)")
    print(f"Wrote   : {out}")


if __name__ == "__main__":
    main()
