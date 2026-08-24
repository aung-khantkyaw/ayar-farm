import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../services/api_service.dart';
import '../constants/api_constants.dart';
import '../widgets/common_snackbar.dart';
import 'pdf_reader_screen.dart';

class DocumentScreen extends StatefulWidget {
  final String type;
  final String? type_id;

  const DocumentScreen({super.key, required this.type, this.type_id});

  @override
  State<DocumentScreen> createState() => _DocumentScreenState();
}

class _DocumentScreenState extends State<DocumentScreen> {
  List<Map<String, dynamic>> _documents = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchDocuments();
  }

  Future<void> _fetchDocuments() async {
    try {
      final queryParams = <String, String>{};

      // Handle special document types with boolean flags
      if (widget.type == 'loan') {
        queryParams['loan'] = 'true';
      } else if (widget.type == 'agromet_bulletin') {
        queryParams['agromet_bulletin'] = 'true';
      } else {
        queryParams['type'] = widget.type;
        if (widget.type_id != null) {
          queryParams['type_id'] = widget.type_id!;
        }
      }

      final response = await ApiService.get(
        ApiConstants.documents,
        queryParams: queryParams,
      );
      if (response['documents'] != null) {
        setState(() {
          _documents = List<Map<String, dynamic>>.from(response['documents']);
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

  String _getTitle(BuildContext context) {
    switch (widget.type) {
      case 'crop':
        return AppLocalizations.of(context)!.cropDocuments;
      case 'fish':
        return AppLocalizations.of(context)!.fishDocuments;
      case 'livestock':
        return AppLocalizations.of(context)!.livestockDocuments;
      case 'machine':
        return AppLocalizations.of(context)!.machineDocuments;
      case 'loan':
        return AppLocalizations.of(context)!.bankLoans;
      case 'agromet_bulletin':
        return AppLocalizations.of(context)!.agrometBulletin;
      default:
        return AppLocalizations.of(context)!.documents;
    }
  }

  Future<void> _downloadDocument(String fileUrl, String title) async {
    if (fileUrl.isEmpty) {
      CommonSnackbar.show(
        context,
        message: 'No file available for download',
        type: SnackBarType.error,
        position: SnackBarPosition.bottom,
      );
      return;
    }

    CommonSnackbar.show(
      context,
      message: 'Starting download...',
      type: SnackBarType.info,
      position: SnackBarPosition.bottom,
    );

    try {
      // Request permissions
      if (Platform.isAndroid) {
        // Try MANAGE_EXTERNAL_STORAGE first (Android 11+), fall back to storage
        var status = await Permission.manageExternalStorage.request();
        if (!status.isGranted) {
          // Fallback for older Android versions
          status = await Permission.storage.request();
        }
        if (!status.isGranted) {
          if (status.isPermanentlyDenied) {
            await openAppSettings();
          }
          CommonSnackbar.show(
            context,
            message: 'Storage permission is required to download files',
            type: SnackBarType.error,
            position: SnackBarPosition.bottom,
          );
          return;
        }
      } else if (Platform.isIOS) {
        var status = await Permission.photos.request();
        if (status != PermissionStatus.granted) {
          CommonSnackbar.show(
            context,
            message: 'Photos permission is required to save files',
            type: SnackBarType.error,
            position: SnackBarPosition.bottom,
          );
          return;
        }
      }

      // Build full URL if needed
      String fullUrl = fileUrl;
      if (!fullUrl.startsWith('http')) {
        fullUrl = '${ApiConstants.baseUrl.replaceAll('/api', '')}/$fileUrl';
      }

      // Determine file name
      String fileName = fileUrl.split('/').last;
      if (fileName.isEmpty) {
        final isPdfFile = fileUrl.toLowerCase().contains('.pdf');
        fileName = '$title.${isPdfFile ? 'pdf' : 'doc'}';
      }

      // Download the file
      final response = await http.get(Uri.parse(fullUrl));
      if (response.statusCode == 200) {
        Directory? downloadDir;

        if (Platform.isAndroid) {
          // Use the public Downloads folder so files are visible in file managers
          downloadDir = Directory('/storage/emulated/0/Download');
          if (!await downloadDir.exists()) {
            // Fallback to app-specific directory if public Downloads is unavailable
            downloadDir = await getExternalStorageDirectory();
            if (downloadDir != null) {
              downloadDir = Directory('${downloadDir.path}/ayarfarm');
            } else {
              downloadDir = await getApplicationDocumentsDirectory();
            }
          }
        } else if (Platform.isIOS) {
          downloadDir = await getApplicationDocumentsDirectory();
        } else {
          downloadDir = await getApplicationDocumentsDirectory();
        }

        if (!await downloadDir.exists()) {
          await downloadDir.create(recursive: true);
        }

        final filePath = '${downloadDir.path}/$fileName';
        final file = File(filePath);
        await file.writeAsBytes(response.bodyBytes);

        CommonSnackbar.show(
          context,
          message: 'Downloaded to: $filePath',
          type: SnackBarType.info,
          position: SnackBarPosition.bottom,
        );
      } else {
        CommonSnackbar.show(
          context,
          message: 'Failed to download file. Status: ${response.statusCode}',
          type: SnackBarType.error,
          position: SnackBarPosition.bottom,
        );
      }
    } catch (e) {
      CommonSnackbar.show(
        context,
        message: 'Error downloading file: $e',
        type: SnackBarType.error,
        position: SnackBarPosition.bottom,
      );
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
                      _getTitle(context),
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

            // Documents List
            Expanded(
              child:
                  _isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : _documents.isEmpty
                      ? Center(
                        child: Text(
                          AppLocalizations.of(context)!.noDocumentsAvailable,
                          style: TextStyle(color: textMutedColor),
                        ),
                      )
                      : RefreshIndicator(
                        onRefresh: _fetchDocuments,
                        color: primaryColor,
                        backgroundColor: surfaceColor,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                          itemCount: _documents.length,
                          itemBuilder: (context, index) {
                            final doc = _documents[index];
                            return _buildDocumentCard(
                              context,
                              doc,
                              surfaceColor,
                              textMainColor,
                              textMutedColor,
                              backgroundColor,
                              isDark,
                              primaryColor,
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

  Widget _buildDocumentCard(
    BuildContext context,
    Map<String, dynamic> doc,
    Color surfaceColor,
    Color textMainColor,
    Color textMutedColor,
    Color backgroundColor,
    bool isDark,
    Color primaryColor,
  ) {
    final title = doc['title'] ?? AppLocalizations.of(context)!.unknown;
    final author = doc['author'] ?? AppLocalizations.of(context)!.anonymous;
    final fileUrls = doc['file_urls'] as List?;
    final fileUrl = fileUrls != null && fileUrls.isNotEmpty ? fileUrls[0] : '';
    final sizeInBits = doc['size'];
    final sizeInMB =
        sizeInBits != null
            ? (sizeInBits / 1000000).toStringAsFixed(1)
            : AppLocalizations.of(context)!.unknown;

    // Determine icon and color based on file type
    final isPdf = fileUrl.toLowerCase().contains('.pdf');
    final icon = isPdf ? Icons.picture_as_pdf : Icons.article;
    final iconColor = isPdf ? Colors.red : Colors.blue;
    final iconBgColor =
        isPdf
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
                builder:
                    (context) =>
                        PdfReaderScreen(fileUrl: fileUrl, title: title),
              ),
            );
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
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
                        ],
                      ),
                    ],
                  ),
                ),

                // Download button
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => _downloadDocument(fileUrl, title),
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.download,
                      color: primaryColor,
                      size: 20,
                    ),
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
