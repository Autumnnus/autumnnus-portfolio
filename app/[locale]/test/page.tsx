export default async function TestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="p-20">
      <h1 className="text-4xl">Test Page</h1>
      <p>Current Locale: {locale}</p>
    </div>
  );
}
