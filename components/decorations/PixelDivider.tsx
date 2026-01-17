export default function PixelDivider() {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="flex gap-1">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary"
            style={{
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
