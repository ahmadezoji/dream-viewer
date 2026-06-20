import '../../../core/api/eeg_api_service.dart';
import '../models/eeg_models.dart';

class EegRepository {
  EegRepository(this._api);
  final EegApiService _api;

  Future<EegMeta> loadJson(String channel, double samplingRate, List<double> signal) => _api.loadJson({'channel': channel, 'samplingRate': samplingRate, 'signal': signal}).then(EegMeta.fromJson);
  Future<EegMeta> loadCsv(String csv) => _api.loadCsv(csv).then(EegMeta.fromJson);
  Future<EegMeta> meta() => _api.getMeta().then(EegMeta.fromJson);
  Future<EegWindow> window(String channel, int start, int size) => _api.getWindow(channel: channel, start: start, size: size).then(EegWindow.fromJson);
  Future<FftSpectrum> fft(String channel, int start, int size) => _api.fft(channel: channel, start: start, size: size).then(FftSpectrum.fromJson);
}
