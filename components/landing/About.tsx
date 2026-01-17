import SectionHeading from "@/components/common/SectionHeading";

export default function About() {
  return (
    <section className="py-12">
      <SectionHeading subHeading="Hakkımda" heading="Ben Kimim?" />

      <div className="pixel-card max-w-3xl">
        <p className="text-muted-foreground leading-relaxed mb-4">
          Yazılım geliştirmeye tutkuyla bağlı bir Full Stack Developer olarak,
          kullanıcı odaklı web uygulamaları geliştiriyorum. Modern teknolojileri
          kullanarak performanslı ve erişilebilir çözümler üretmeyi
          hedefliyorum.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Sonbahar teması gibi, sıcak ve davetkar kullanıcı deneyimleri
          yaratmayı seviyorum. Her proje, yeni bir yaprak gibi benzersiz ve
          değerli.
        </p>
      </div>
    </section>
  );
}
