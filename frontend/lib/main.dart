import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'core/api/eeg_api_service.dart';
import 'features/eeg/data/eeg_repository.dart';
import 'features/eeg/presentation/eeg_cubit.dart';
import 'features/eeg/presentation/eeg_dashboard_page.dart';

void main() => runApp(const EegAnalyzerApp());

class EegAnalyzerApp extends StatelessWidget {
  const EegAnalyzerApp({super.key});

  @override
  Widget build(BuildContext context) {
    final repository = EegRepository(EegApiService());
    return MaterialApp(
      title: 'EEG Analyzer MVP',
      theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo), useMaterial3: true),
      home: BlocProvider(
        create: (_) => EegCubit(repository)..bootstrap(),
        child: const EegDashboardPage(),
      ),
    );
  }
}
