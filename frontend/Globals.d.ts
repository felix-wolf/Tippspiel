declare module "*.module.css";
declare module "*.module.scss";
declare module "*.svg";
declare module "*.mp4";
declare module "*.mp3";
declare module "*.m4a";
declare module "*.ogg";
declare module "*.png";
declare module "*.jpg";
declare module "*.sql";
declare const DEVELOPMENT: boolean;
declare const __dirname: string;

interface Navigator {
	keyboard: NavigatorKeyboard;
}

declare interface NavigatorKeyboard {
	getLayoutMap(): Promise<NavigatorKeyboardLayoutMap>;
}

declare interface NavigatorKeyboardLayoutMap {
	get(code: string): string | undefined;
}

declare interface Window {
	bridge: {
		request: (
			event: string,
			data: unknown
		) => Promise<{ data: unknown; error?: undefined } | { data?: undefined; error: unknown }>;
		dialog: {
			showErrorBox(title: string, description: string): void;
		};
	};
}
