import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import 'package:pdfx/pdfx.dart';
import 'package:http/http.dart' as http;
import 'dart:typed_data';
import 'dart:io' show Platform;
import 'package:url_launcher/url_launcher.dart';

class PdfReaderScreen extends StatefulWidget {
  final String fileUrl;
  final String title;

  const PdfReaderScreen({
    super.key,
    required this.fileUrl,
    required this.title,
  });

  @override
  State<PdfReaderScreen> createState() => _PdfReaderScreenState();
}

class _PdfReaderScreenState extends State<PdfReaderScreen> {
  PdfController? _pdfController;
  bool _isLoading = true;
  String? _errorMessage;
  int _totalPages = 0;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    // For web platform, open PDF in browser instead of in-app viewer
    if (_isWebPlatform()) {
      _openPdfInBrowser();
    } else {
      _initializePdf();
    }
  }

  bool _isWebPlatform() {
    try {
      return identical(0, 0.0) || Platform.isAndroid || Platform.isIOS;
    } catch (e) {
      // If Platform is not available (web), return true
      return true;
    }
  }

  Future<void> _openPdfInBrowser() async {
    try {
      final uri = Uri.parse(widget.fileUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        // Close this screen since PDF opened in browser
        if (mounted) {
          Navigator.pop(context);
        }
      } else {
        setState(() {
          _errorMessage = AppLocalizations.of(context)!.cannotOpenPdfInBrowser;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = '${AppLocalizations.of(context)!.failedToOpenPdf}$e';
        _isLoading = false;
      });
    }
  }

  Future<void> _initializePdf() async {
    try {
      final pdfData = await _loadPdfData();
      _pdfController = PdfController(document: PdfDocument.openData(pdfData));

      // Get total pages
      final document = await _pdfController!.document;
      final pages = document.pagesCount;
      setState(() {
        _totalPages = pages;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = '${AppLocalizations.of(context)!.failedToLoadPdf}$e';
        _isLoading = false;
      });
    }
  }

  Future<Uint8List> _loadPdfData() async {
    try {
      final response = await http.get(Uri.parse(widget.fileUrl));
      if (response.statusCode == 200) {
        return response.bodyBytes;
      } else {
        throw Exception('Failed to load PDF: HTTP ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to load PDF: $e');
    }
  }

  @override
  void dispose() {
    _pdfController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor = isDark ? const Color(0xFF1A2C1E) : Colors.white;
    final textMainColor = isDark ? Colors.white : const Color(0xFF111813);
    final textMutedColor =
        isDark ? const Color(0xFF8BA892) : const Color(0xFF61896B);
    final backgroundColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: surfaceColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: textMainColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.title,
          style: TextStyle(
            color: textMainColor,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          if (_totalPages > 0)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Center(
                child: Text(
                  '${_currentPage + 1} / $_totalPages',
                  style: TextStyle(color: textMutedColor, fontSize: 14),
                ),
              ),
            ),
        ],
      ),
      body:
          _isWebPlatform()
              ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 16),
                    Text(AppLocalizations.of(context)!.openingPdfInBrowser),
                  ],
                ),
              )
              : _isLoading
              ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 16),
                    Text(AppLocalizations.of(context)!.loadingPdf),
                  ],
                ),
              )
              : _errorMessage != null
              ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline, size: 64, color: Colors.red),
                    SizedBox(height: 16),
                    Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: TextStyle(color: textMutedColor),
                    ),
                    SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _isLoading = true;
                          _errorMessage = null;
                        });
                        _initializePdf();
                      },
                      child: Text(AppLocalizations.of(context)!.retry),
                    ),
                  ],
                ),
              )
              : PdfView(
                controller: _pdfController!,
                onDocumentLoaded: (document) {
                  setState(() {
                    _totalPages = document.pagesCount;
                  });
                },
                onPageChanged: (page) {
                  setState(() {
                    _currentPage = page;
                  });
                },
                scrollDirection: Axis.vertical,
              ),
    );
  }
}
