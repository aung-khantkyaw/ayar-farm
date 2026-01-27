import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../services/api_service.dart';
import '../constants/api_constants.dart';
import 'pdf_reader_screen.dart';

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
    const primaryColor = Color(0xFF2BEE5B);
    final surfaceColor = isDark ? const Color(0xFF1A2C1E) : Colors.white;
    final textMainColor = isDark ? Colors.white : const Color(0xFF111813);
    final textMutedColor =
        isDark ? const Color(0xFF8BA892) : const Color(0xFF61896B);
    final backgroundColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              color: surfaceColor.withOpacity(0.95),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  InkWell(
                    onTap: () => Navigator.pop(context),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDark ? Colors.grey[800] : Colors.grey[100],
                      ),
                      child: const Icon(Icons.arrow_back, size: 24),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      AppLocalizations.of(context)!.privacyPolicy,
                      style: TextStyle(
                        color: textMainColor,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Privacy Policy Content
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _latestPrivacyPolicy == null
                      ? Center(
                          child: Text(
                            AppLocalizations.of(context)!.noPrivacyPolicyAvailable,
                            style: TextStyle(color: textMutedColor),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _fetchLatestPrivacyPolicy,
                          color: primaryColor,
                          backgroundColor: surfaceColor,
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.all(16),
                            child: _buildPrivacyPolicyCard(
                              context,
                              _latestPrivacyPolicy!,
                              surfaceColor,
                              textMainColor,
                              textMutedColor,
                              backgroundColor,
                              isDark,
                            ),
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPrivacyPolicyCard(
    BuildContext context,
    Map<String, dynamic> policy,
    Color surfaceColor,
    Color textMainColor,
    Color textMutedColor,
    Color backgroundColor,
    bool isDark,
  ) {
    final title = policy['title'] ?? AppLocalizations.of(context)!.privacyPolicy;
    final author = policy['author'] ?? AppLocalizations.of(context)!.anonymous;
    final resourceUrls = policy['resource_url'] as List?;
    final resourceUrl = resourceUrls != null && resourceUrls.isNotEmpty ? resourceUrls[0] as String : '';
    final fileName = policy['filename'] ?? AppLocalizations.of(context)!.unknown;
    final sizeInBits = policy['size'];
    final sizeInMB = sizeInBits != null
        ? (sizeInBits / 1000000).toStringAsFixed(1)
        : AppLocalizations.of(context)!.unknown;
    final uploadedAt = DateTime.parse(policy['uploaded_at']);

    // Determine icon and color based on file type
    final isPdf = resourceUrl.toLowerCase().contains('.pdf');
    final icon = isPdf ? Icons.picture_as_pdf : Icons.article;
    final iconColor = isPdf ? Colors.red : Colors.blue;
    final iconBgColor = isPdf
        ? (isDark ? Colors.red[900]!.withOpacity(0.2) : Colors.red[50]!)
        : (isDark ? Colors.blue[900]!.withOpacity(0.2) : Colors.blue[50]!);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.transparent),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            // Navigate to PDF reader screen
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => PdfReaderScreen(
                  fileUrl: resourceUrl,
                  title: title,
                ),
              ),
            );
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // Icon
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: iconBgColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(icon, color: iconColor, size: 24),
                    ),
                    const SizedBox(width: 16),

                    // Content
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: TextStyle(
                              color: textMainColor,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              height: 1.2,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: backgroundColor,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  author,
                                  style: TextStyle(
                                    color: textMutedColor,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '• ${sizeInMB} MB',
                                style: TextStyle(
                                  color: textMutedColor,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // File name
                Text(
                  fileName,
                  style: TextStyle(
                    color: textMutedColor,
                    fontSize: 12,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                // Uploaded date
                Text(
                  'Uploaded: ${uploadedAt.year}/${uploadedAt.month}/${uploadedAt.day}',
                  style: TextStyle(
                    color: textMutedColor,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}