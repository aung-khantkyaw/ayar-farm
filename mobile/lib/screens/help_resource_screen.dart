import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../services/api_service.dart';
import '../constants/api_constants.dart';
import 'pdf_reader_screen.dart';

class HelpResourceScreen extends StatefulWidget {
  const HelpResourceScreen({super.key});

  @override
  State<HelpResourceScreen> createState() => _HelpResourceScreenState();
}

class _HelpResourceScreenState extends State<HelpResourceScreen> {
  List<Map<String, dynamic>> _helpResources = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchHelpResources();
  }

  Future<void> _fetchHelpResources() async {
    try {
      final response = await ApiService.get(
        ApiConstants.resources,
        queryParams: {'type': 'HELP_RESOURCE'},
      );
      
      if (response['resources'] != null) {
        setState(() {
          _helpResources = List<Map<String, dynamic>>.from(response['resources']);
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
                      AppLocalizations.of(context)!.helpResources,
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

            // Help Resources List
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _helpResources.isEmpty
                      ? Center(
                          child: Text(
                            AppLocalizations.of(context)!.noHelpResourcesAvailable,
                            style: TextStyle(color: textMutedColor),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _fetchHelpResources,
                          color: primaryColor,
                          backgroundColor: surfaceColor,
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                            itemCount: _helpResources.length,
                            itemBuilder: (context, index) {
                              return _buildHelpResourceCard(
                                context,
                                _helpResources[index],
                                surfaceColor,
                                textMainColor,
                                textMutedColor,
                                backgroundColor,
                                isDark,
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHelpResourceCard(
    BuildContext context,
    Map<String, dynamic> resource,
    Color surfaceColor,
    Color textMainColor,
    Color textMutedColor,
    Color backgroundColor,
    bool isDark,
  ) {
    final title = resource['title'] ?? AppLocalizations.of(context)!.helpResource;
    final author = resource['author'] ?? AppLocalizations.of(context)!.anonymous;
    final resourceUrls = resource['resource_url'] as List?;
    final resourceUrl = resourceUrls != null && resourceUrls.isNotEmpty ? resourceUrls[0] as String : '';
    final fileName = resource['filename'] ?? AppLocalizations.of(context)!.unknown;
    final sizeInBits = resource['size'];
    final sizeInMB = sizeInBits != null
        ? (sizeInBits / 1000000).toStringAsFixed(1)
        : AppLocalizations.of(context)!.unknown;
    final uploadedAt = DateTime.parse(resource['uploaded_at']);

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