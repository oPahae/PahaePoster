import { getOrCreateCurrentSession } from "../../lib/sharerStore";

export default function SharerIndexPage() {
  return null;
}

export async function getServerSideProps() {
  const meta = getOrCreateCurrentSession();
  return {
    redirect: {
      destination: `/sharer/${meta.code}`,
      permanent: false
    }
  };
}
