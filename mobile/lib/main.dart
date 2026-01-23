import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'l10n/app_localizations.dart';
import 'screens/welcome_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/verify_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/reset_password_screen.dart';
import 'screens/main_screen.dart';
import 'widgets/auth_guard.dart';
import 'services/auth_service.dart';
import 'services/notification_service.dart';

final ValueNotifier<Locale> appLocaleNotifier = ValueNotifier(
  const Locale('my'),
);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationService().init();
  await AuthService.loadSession();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<Locale>(
      valueListenable: appLocaleNotifier,
      builder: (context, locale, child) {
        return MaterialApp(
          onGenerateTitle: (context) => AppLocalizations.of(context)!.appTitle,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF41BE02), // Primary seed
              primary: const Color(0xFF41BE02),
              secondary: const Color(0xFFF1B84F),
              background: const Color(0xFFFFE4AD),
            ),
            scaffoldBackgroundColor: const Color(0xFFFFE4AD),
          ),
          debugShowCheckedModeBanner: false,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [
            Locale('en'), // English
            Locale('my'), // Myanmar
          ],
          locale: locale,
          home:
              AuthService.currentUser != null
                  ? const MainScreen()
                  : const AuthGuard(child: WelcomeScreen()),
          routes: {
            '/home': (context) => const MainScreen(),
            '/login': (context) => const AuthGuard(child: LoginScreen()),
            '/register': (context) => const AuthGuard(child: RegisterScreen()),
            '/verify': (context) => const AuthGuard(child: VerifyScreen()),
            '/forgot-password': (context) => const ForgotPasswordScreen(),
            '/reset-password': (context) => const ResetPasswordScreen(),
          },
        );
      },
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  void _incrementCounter() {
    setState(() {
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text(AppLocalizations.of(context)!.pushedButtonMessage),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: AppLocalizations.of(context)!.increment,
        child: const Icon(Icons.add),
      ),
    );
  }
}
