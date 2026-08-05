import 'package:flutter/material.dart';
import 'category_screen.dart';
import 'crop_screen.dart';

class CategoryNavigator extends StatelessWidget {
  const CategoryNavigator({super.key});

  @override
  Widget build(BuildContext context) {
    return Navigator(
      onGenerateRoute: (settings) {
        Widget page;
        if (settings.name == '/crop') {
          page = const CropScreen();
        } else {
          page = const CategoryScreen();
        }
        return MaterialPageRoute(builder: (_) => page);
      },
    );
  }
}
