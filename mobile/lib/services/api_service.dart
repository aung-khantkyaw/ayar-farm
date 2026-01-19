import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart'; // for kIsWeb
import 'package:image_picker/image_picker.dart'; // for XFile
import '../constants/api_constants.dart';

class ApiService {
  static String? _token;

  static void setToken(String? token) {
    _token = token;
  }

  static String? getToken() {
    return _token;
  }

  static Map<String, String> _getHeaders() {
    final headers = {'Content-Type': 'application/json'};
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  static Future<Map<String, dynamic>> post(
    String endpoint,
    Map<String, dynamic> data,
  ) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final response = await http.post(
      url,
      headers: _getHeaders(),
      body: jsonEncode(data),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> get(
    String endpoint, {
    Map<String, String>? queryParams,
  }) async {
    final uri = Uri.parse(
      '${ApiConstants.baseUrl}$endpoint',
    ).replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: _getHeaders());
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> put(
    String endpoint,
    Map<String, dynamic> data,
  ) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final response = await http.put(
      url,
      headers: _getHeaders(),
      body: jsonEncode(data),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> postMultipart(
    String endpoint,
    Map<String, String> fields, {
    Map<String, dynamic>? files,
  }) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final request = http.MultipartRequest('POST', url);

    final headers = _getHeaders();
    headers.remove('Content-Type');
    request.headers.addAll(headers);

    fields.forEach((key, value) {
      request.fields[key] = value;
    });

    if (files != null) {
      for (var entry in files.entries) {
        if (entry.value is String && (entry.value as String).isNotEmpty) {
          if (!kIsWeb) {
            request.files.add(
              await http.MultipartFile.fromPath(entry.key, entry.value),
            );
          }
        } else if (entry.value is List<String>) {
          if (!kIsWeb) {
            for (var path in (entry.value as List<String>)) {
              if (path.isNotEmpty) {
                request.files.add(
                  await http.MultipartFile.fromPath(entry.key, path),
                );
              }
            }
          }
        } else if (entry.value is List &&
            (entry.value as List).isNotEmpty &&
            (entry.value as List).first is XFile) {
          for (var item in (entry.value as List)) {
            final file = item as XFile;
            if (kIsWeb) {
              request.files.add(
                http.MultipartFile.fromBytes(
                  entry.key,
                  await file.readAsBytes(),
                  filename: file.name,
                ),
              );
            } else {
              request.files.add(
                await http.MultipartFile.fromPath(entry.key, file.path),
              );
            }
          }
        }
      }
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> putMultipart(
    String endpoint,
    Map<String, String> fields, {
    Map<String, dynamic>? files,
  }) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final request = http.MultipartRequest('PUT', url);

    final headers = _getHeaders();
    headers.remove('Content-Type');
    request.headers.addAll(headers);

    fields.forEach((key, value) {
      request.fields[key] = value;
    });

    if (files != null) {
      for (var entry in files.entries) {
        if (entry.value is String && (entry.value as String).isNotEmpty) {
          if (!kIsWeb) {
            request.files.add(
              await http.MultipartFile.fromPath(entry.key, entry.value),
            );
          }
        } else if (entry.value is List<String>) {
          if (!kIsWeb) {
            for (var path in (entry.value as List<String>)) {
              if (path.isNotEmpty) {
                request.files.add(
                  await http.MultipartFile.fromPath(entry.key, path),
                );
              }
            }
          }
        } else if (entry.value is List &&
            (entry.value as List).isNotEmpty &&
            (entry.value as List).first is XFile) {
          for (var item in (entry.value as List)) {
            final file = item as XFile;
            if (kIsWeb) {
              request.files.add(
                http.MultipartFile.fromBytes(
                  entry.key,
                  await file.readAsBytes(),
                  filename: file.name,
                ),
              );
            } else {
              request.files.add(
                await http.MultipartFile.fromPath(entry.key, file.path),
              );
            }
          }
        }
      }
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> delete(String endpoint) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final response = await http.delete(url, headers: _getHeaders());
    return jsonDecode(response.body);
  }
}
