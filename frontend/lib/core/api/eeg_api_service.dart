import 'package:dio/dio.dart';

class EegApiService {
  EegApiService({Dio? dio}) : _dio = dio ?? Dio(BaseOptions(baseUrl: const String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:8080')));
  final Dio _dio;

  Future<Map<String, dynamic>> loadJson(Map<String, dynamic> payload) async => (await _dio.post('/api/eeg/load-json', data: payload)).data;
  Future<Map<String, dynamic>> loadCsv(String csv) async => (await _dio.post('/api/eeg/load-csv', data: csv, options: Options(contentType: 'text/csv'))).data;
  Future<Map<String, dynamic>> getMeta() async => (await _dio.get('/api/eeg/meta')).data;
  Future<Map<String, dynamic>> getWindow({required String channel, required int start, required int size}) async => (await _dio.get('/api/eeg/window', queryParameters: {'channel': channel, 'start': start, 'size': size})).data;
  Future<Map<String, dynamic>> fft({required String channel, required int start, required int size}) async => (await _dio.post('/api/eeg/fft', data: {'channel': channel, 'windowStart': start, 'windowSize': size})).data;
}
