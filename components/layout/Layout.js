import { useRouter } from "next/router";
import Sidebar from "./Sidebar";
import DatabaseModule from "../database/DatabaseModule";
import PosterModule from "../poster/PosterModule";
import SsherModule from "../ssher/SsherModule";
import ClasserModule from "../classer/ClasserModule";

export default function Layout({ children }) {
  const router = useRouter();
  const path = router.pathname;
  const showChildren = path === "/" || path.startsWith("/sharer");
  const isSharerRoute = path.startsWith("/sharer");

  return (
    <div className="flex h-screen overflow-hidden bg-base-950">
      <Sidebar hideOnMobile={isSharerRoute} />
      <main className="relative flex-1 overflow-hidden">
        <div className={showChildren ? "h-full overflow-y-auto" : "hidden"}>{showChildren && children}</div>
        <div className={path === "/databaser" ? "h-full" : "hidden"}>
          <DatabaseModule />
        </div>
        <div className={path === "/poster" ? "h-full" : "hidden"}>
          <PosterModule />
        </div>
        <div className={path === "/ssher" ? "h-full" : "hidden"}>
          <SsherModule />
        </div>
        <div className={path === "/classer" ? "h-full" : "hidden"}>
          <ClasserModule />
        </div>
      </main>
    </div>
  );
}
