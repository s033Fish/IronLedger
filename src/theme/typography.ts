import { useFonts } from "expo-font";
import { TextStyle } from "react-native";


export function useAppFonts() {
    const [loaded] = useFonts({
        BebasNeue: require("../../assets/fonts/BebasNeue-Regular.ttf"),
        Inter: require("../../assets/fonts/Inter-Regular.ttf"),
        InterBold: require("../../assets/fonts/Inter-Bold.ttf"),
    });
    return loaded;
}


export const type = {
    h1: { fontFamily: "BebasNeue", fontSize: 32, letterSpacing: 1 } as TextStyle,
    h2: { fontFamily: "BebasNeue", fontSize: 24, letterSpacing: 0.5 } as TextStyle,
    body: { fontFamily: "Inter", fontSize: 16, lineHeight: 22 } as TextStyle,
    bodyBold: { fontFamily: "InterBold", fontSize: 16, lineHeight: 22, fontWeight: 700 } as TextStyle,
    mono: { fontFamily: "Inter", fontSize: 14, letterSpacing: 0.5 } as TextStyle,
    caption: { fontFamily: "Inter", fontSize: 12, lineHeight: 16 } as TextStyle,
};