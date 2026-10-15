import { sessionExists, readSessionMeta } from "../../lib/sharerStore";
import SharerView from "../../components/sharer/SharerView";

export default function SharerSessionPage({ code }) {
  return <SharerView code={code} />;
}

export async function getServerSideProps(context) {
  const { session } = context.params;
  if (!sessionExists(session)) {
    return { notFound: true };
  }
  const meta = readSessionMeta(session);
  return { props: { code: meta.code, createdAt: meta.createdAt } };
}
