import "./globals.css";
import "./queue.css";
import AppChrome from "./components/AppChrome";
export const metadata={title:"Garimpo Afiliados | Vitrine dos Achados",description:"Supervisão do Autopiloto da Vitrine dos Achados",applicationName:"Garimpo Afiliados",appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"Garimpo"},formatDetection:{telephone:false},icons:{icon:"/icon.svg",apple:"/icon.svg"}};
export const viewport={themeColor:"#071229",width:"device-width",initialScale:1,viewportFit:"cover"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><AppChrome/>{children}</body></html>}
