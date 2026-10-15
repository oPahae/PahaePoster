import "../globals.css";
import "react-json-view-lite/dist/index.css";
import "xterm/css/xterm.css";
import Layout from "../components/layout/Layout";
import { NotificationProvider } from "../components/layout/NotificationContext";
import { ThemeProvider } from "../components/layout/ThemeContext";

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </NotificationProvider>
    </ThemeProvider>
  );
}
