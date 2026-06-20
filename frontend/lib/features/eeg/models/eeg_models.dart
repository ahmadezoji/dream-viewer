class EegMeta {
  EegMeta({required this.samplingRate, required this.channels, required this.totalSamples, required this.durationSeconds, required this.source});
  factory EegMeta.fromJson(Map<String, dynamic> json) => EegMeta(samplingRate: (json['samplingRate'] as num).toDouble(), channels: List<String>.from(json['channels'] as List), totalSamples: json['totalSamples'] as int, durationSeconds: (json['durationSeconds'] as num).toDouble(), source: json['source'] as String);
  final double samplingRate;
  final List<String> channels;
  final int totalSamples;
  final double durationSeconds;
  final String source;
}

class EegWindow {
  EegWindow({required this.times, required this.values, required this.windowStart, required this.windowSize});
  factory EegWindow.fromJson(Map<String, dynamic> json) => EegWindow(times: (json['times'] as List).map((e) => (e as num).toDouble()).toList(), values: (json['values'] as List).map((e) => (e as num).toDouble()).toList(), windowStart: json['windowStart'] as int, windowSize: json['windowSize'] as int);
  final List<double> times;
  final List<double> values;
  final int windowStart;
  final int windowSize;
}

class FftSpectrum {
  FftSpectrum({required this.frequencies, required this.magnitudes});
  factory FftSpectrum.fromJson(Map<String, dynamic> json) => FftSpectrum(frequencies: (json['frequencies'] as List).map((e) => (e as num).toDouble()).toList(), magnitudes: (json['magnitudes'] as List).map((e) => (e as num).toDouble()).toList());
  final List<double> frequencies;
  final List<double> magnitudes;
}
