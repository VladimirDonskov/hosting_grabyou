import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SpbMap from '@site/src/components/brand/SpbMap';
import {
  IconArrow,
  IconRuStore,
  IconTelegram,
  IconVK,
} from '@site/src/components/brand/icons';
import styles from './download.module.css';

const channels = [
  {
    key: 'rustore',
    href: 'https://www.rustore.ru/catalog/app/com.grabyou.app',
    device: 'Приложение для Android',
    title: 'Установи из RuStore',
    desc: 'Официальный магазин приложений. Полная версия GrabYou с push-уведомлениями и автообновлениями.',
    cta: 'Открыть в RuStore',
    Icon: IconRuStore,
    featured: true,
  },
  {
    key: 'telegram',
    href: 'https://t.me/GrabYou_bot',
    device: 'На любом устройстве · без установки',
    title: 'Telegram',
    desc: '@GrabYou_bot — прямо в мессенджере, на любом устройстве',
    cta: 'Открыть в Telegram',
    Icon: IconTelegram,
  },
  {
    key: 'vk',
    href: 'https://vk.com/app54610417',
    device: 'VK Mini App · без установки',
    title: 'ВКонтакте',
    desc: 'Запусти в соцсети — ничего не устанавливая',
    cta: 'Открыть ВКонтакте',
    Icon: IconVK,
  },
];

export default function DownloadPage() {
  return (
    <Layout
      title="Скачать GrabYou"
      description="Скачай приложение GrabYou — доступно в RuStore, Telegram и VK Mini Apps">
      <main className={styles.page}>
        <div className={styles.map} aria-hidden="true">
          <SpbMap className={styles.mapSvg} />
        </div>
        <div className={styles.fade} aria-hidden="true" />

        <div className="container">
          <section className={styles.hero} aria-labelledby="download-title">
            <img src={useBaseUrl('/img/brand/logo-icon.svg')} alt="" className={styles.mark} width="88" height="88" />
            <h1 id="download-title" className={styles.title}>
              Открой GrabYou
            </h1>
            <p className={styles.subtitle}>
              Работает на любом устройстве — без регистрации и лишних шагов.
              Просто выбери удобный способ.
            </p>
            <p className={styles.deviceGuide}>
              <strong>Android</strong> — RuStore. <strong>iPhone и компьютер</strong> — Telegram или ВКонтакте.
            </p>
          </section>

          <section className={styles.grid} aria-label="Способы открыть GrabYou">
            {channels.map(({key, href, device, title, desc, cta, Icon, featured}) => (
              <Link
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${cta} (в новой вкладке)`}
                className={`${styles.card} ${featured ? styles.cardFeatured : ''}`}
                data-channel={key}>
                <span className={styles.cardIcon}>
                  <Icon size={featured ? 44 : 30} />
                </span>
                <div className={styles.cardBody}>
                  <Heading as="h2" className={styles.cardTitle}>{title}</Heading>
                  <span className={styles.device}>{device}</span>
                  <span className={styles.cardDesc}>{desc}</span>
                </div>
                <span className={styles.cardCta}>
                  {cta} <IconArrow size={18} />
                </span>
              </Link>
            ))}
          </section>

          <p className={styles.back}>
            <Link to="/" className={styles.backLink}>
              ← На главную
            </Link>
          </p>
        </div>
      </main>
    </Layout>
  );
}
