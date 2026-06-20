import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'eeg_cubit.dart';

class EegDashboardPage extends StatelessWidget {
  const EegDashboardPage({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('EEG Analyzer MVP')),
        body: BlocBuilder<EegCubit, EegState>(
          builder: (context, state) {
            final cubit = context.read<EegCubit>();
            return Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 12,
                    children: [
                      FilledButton.icon(
                        onPressed: cubit.pickJson,
                        icon: const Icon(Icons.upload_file),
                        label: const Text('Load JSON'),
                      ),
                      OutlinedButton.icon(
                        onPressed: cubit.pickCsv,
                        icon: const Icon(Icons.table_chart),
                        label: const Text('Load CSV'),
                      ),
                      const Tooltip(
                        message: 'Experimental: convert Sleep-EDF PSG files to CSV/JSON for now.',
                        child: OutlinedButton(
                          onPressed: null,
                          child: Text('Load EDF (experimental)'),
                        ),
                      ),
                      IconButton(onPressed: cubit.backward, icon: const Icon(Icons.skip_previous)),
                      IconButton(
                        onPressed: cubit.togglePlay,
                        icon: Icon(state.playing ? Icons.pause : Icons.play_arrow),
                      ),
                      IconButton(onPressed: cubit.forward, icon: const Icon(Icons.skip_next)),
                    ],
                  ),
                  if (state.error != null) Text(state.error!, style: const TextStyle(color: Colors.red)),
                  if (state.loading) const LinearProgressIndicator(),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      'Channel: ${state.channel} • Sampling: ${state.meta?.samplingRate.toStringAsFixed(1) ?? '-'} Hz • Window start: ${state.windowStart} samples • Source: ${state.meta?.source ?? '-'}',
                    ),
                  ),
                  Expanded(
                    child: Row(
                      children: [
                        Expanded(
                          child: _Chart(
                            title: 'EEG signal window',
                            x: state.window?.times ?? const [],
                            y: state.window?.values ?? const [],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _Chart(
                            title: 'FFT spectrum',
                            x: state.spectrum?.frequencies ?? const [],
                            y: state.spectrum?.magnitudes ?? const [],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      );
}

class _Chart extends StatelessWidget {
  const _Chart({required this.title, required this.x, required this.y});

  final String title;
  final List<double> x;
  final List<double> y;

  @override
  Widget build(BuildContext context) {
    final spots = [for (var i = 0; i < x.length && i < y.length; i++) FlSpot(x[i], y[i])];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            Expanded(
              child: spots.isEmpty
                  ? const Center(child: Text('No data loaded'))
                  : LineChart(
                      LineChartData(
                        lineBarsData: [
                          LineChartBarData(
                            spots: spots,
                            isCurved: false,
                            dotData: const FlDotData(show: false),
                          ),
                        ],
                        titlesData: const FlTitlesData(
                          rightTitles: AxisTitles(),
                          topTitles: AxisTitles(),
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
