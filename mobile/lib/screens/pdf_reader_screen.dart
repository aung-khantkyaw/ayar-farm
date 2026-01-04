import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

class PdfReaderScreen extends StatelessWidget {
  final String fileUrl;
  final String title;

  const PdfReaderScreen({
    super.key,
    required this.fileUrl,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor = isDark ? const Color(0xFF1A2C1E) : Colors.white;
    final textMainColor = isDark ? Colors.white : const Color(0xFF111813);
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
          title,
          style: TextStyle(
            color: textMainColor,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SfPdfViewer.network(fileUrl),
    );
  }
}
