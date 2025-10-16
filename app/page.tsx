import dynamic from 'next/dynamic';

const CCTVScene = dynamic(() => import('../components/CCTVScene'), { ssr: false });

export default function Page() {
  return (
    <main>
      <CCTVScene />
    </main>
  );
}
