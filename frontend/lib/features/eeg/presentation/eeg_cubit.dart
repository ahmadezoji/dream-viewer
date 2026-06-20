import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'package:equatable/equatable.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/eeg_repository.dart';
import '../models/eeg_models.dart';

class EegState extends Equatable {
  const EegState({this.meta, this.window, this.spectrum, this.channel = 'Fpz-Cz', this.windowStart = 0, this.windowSeconds = 10, this.loading = false, this.playing = false, this.error});
  final EegMeta? meta; final EegWindow? window; final FftSpectrum? spectrum; final String channel; final int windowStart; final int windowSeconds; final bool loading; final bool playing; final String? error;
  int get windowSize => ((meta?.samplingRate ?? 100) * windowSeconds).round();
  EegState copyWith({EegMeta? meta, EegWindow? window, FftSpectrum? spectrum, String? channel, int? windowStart, bool? loading, bool? playing, String? error}) => EegState(meta: meta ?? this.meta, window: window ?? this.window, spectrum: spectrum ?? this.spectrum, channel: channel ?? this.channel, windowStart: windowStart ?? this.windowStart, loading: loading ?? this.loading, playing: playing ?? this.playing, error: error);
  @override List<Object?> get props => [meta, window, spectrum, channel, windowStart, loading, playing, error];
}

class EegCubit extends Cubit<EegState> {
  EegCubit(this._repository) : super(const EegState());
  final EegRepository _repository; Timer? _timer;

  Future<void> bootstrap() async {
    final demo = List<double>.generate(3000, (i) => 20 * math.sin(i / 8) + 6 * math.sin(i / 2.3));
    await _load(() => _repository.loadJson('Fpz-Cz', 100, demo));
  }
  Future<void> pickJson() async { final file = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['json']); if (file?.files.single.bytes == null) return; final json = jsonDecode(utf8.decode(file!.files.single.bytes!)); await _load(() => _repository.loadJson(json['channel'] as String, (json['samplingRate'] as num).toDouble(), (json['signal'] as List).map((e) => (e as num).toDouble()).toList())); }
  Future<void> pickCsv() async { final file = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['csv']); if (file?.files.single.bytes == null) return; await _load(() => _repository.loadCsv(utf8.decode(file!.files.single.bytes!))); }
  Future<void> _load(Future<EegMeta> Function() loader) async { emit(state.copyWith(loading: true, error: null)); try { final meta = await loader(); emit(state.copyWith(meta: meta, channel: meta.channels.first, windowStart: 0, loading: false)); await refresh(); } catch (e) { emit(state.copyWith(loading: false, error: e.toString())); } }
  Future<void> refresh() async { final meta = state.meta; if (meta == null) return; emit(state.copyWith(loading: true, error: null)); try { final window = await _repository.window(state.channel, state.windowStart, state.windowSize); final spectrum = await _repository.fft(state.channel, state.windowStart, state.windowSize); emit(state.copyWith(window: window, spectrum: spectrum, loading: false)); } catch (e) { emit(state.copyWith(loading: false, error: e.toString())); } }
  void forward() { emit(state.copyWith(windowStart: state.windowStart + state.windowSize)); refresh(); }
  void backward() { emit(state.copyWith(windowStart: (state.windowStart - state.windowSize).clamp(0, 1 << 31))); refresh(); }
  void togglePlay() { if (state.playing) { _timer?.cancel(); emit(state.copyWith(playing: false)); } else { _timer = Timer.periodic(const Duration(seconds: 1), (_) => forward()); emit(state.copyWith(playing: true)); } }
  @override Future<void> close() { _timer?.cancel(); return super.close(); }
}
