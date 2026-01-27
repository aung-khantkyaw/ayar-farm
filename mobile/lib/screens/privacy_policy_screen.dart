import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../services/api_service.dart';
import '../constants/api_constants.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

class PrivacyPolicyScreen extends StatefulWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  State<PrivacyPolicyScreen> createState() => _PrivacyPolicyScreenState();
}

class _PrivacyPolicyScreenState extends State<PrivacyPolicyScreen> {
  Map<String, dynamic>? _latestPrivacyPolicy;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLatestPrivacyPolicy();
  }

  Future<void> _fetchLatestPrivacyPolicy() async {
    try {
      final response = await ApiService.get(
        ApiConstants.resources,
        queryParams: {'type': 'PRIVACY_POLICY'},
      );
      
      if (response['resources'] != null && response['resources'].length > 0) {
        // Sort by uploaded_at to get the most recent one
        var resources = List<Map<String, dynamic>>.from(response['resources']);
        resources.sort((a, b) {
          DateTime dateA = DateTime.parse(a['uploaded_at']);
          DateTime dateB = DateTime.parse(b['uploaded_at']);
          return dateB.compareTo(dateA); // Descending order (most recent first)
        });
        
        setState(() {
          _latestPrivacyPolicy = resources.first;
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textMainColor = isDark ? Colors.white : const Color(0xFF111813);
    final backgroundColor = isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF1A2C1E) : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: textMainColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          AppLocalizations.of(context)!.privacyPolicy,
          style: TextStyle(
            color: textMainColor,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _latestPrivacyPolicy == null
              ? Center(
                  child: Text(
                    AppLocalizations.of(context)!.noPrivacyPolicyAvailable,
                    style: TextStyle(
                      color: isDark ? const Color(0xFF8BA892) : const Color(0xFF61896B),
                    ),
                  ),
                )
              : SfPdfViewer.network(
                  _latestPrivacyPolicy!['resource_url'][0],
                  onDocumentLoaded: (PdfDocumentLoadedDetails details) {
                    // Optional: Handle document loaded event
                  },
                ),
    );
  }
}