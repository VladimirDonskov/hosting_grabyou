import {useEffect, useRef, useState} from 'react';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SpbMap from '@site/src/components/brand/SpbMap';
import {
  IconBread,
  IconArrow,
  IconCard,
  IconCheck,
  IconClock,
  IconCoffee,
  IconFlower,
  IconFood,
  IconLeaf,
  IconMail,
  IconPin,
  IconQr,
  IconStore,
  IconTelegram,
  IconZap,
} from '@site/src/components/brand/icons';
import styles from './styles.module.css';

function usePlayback() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting) setSeen(true);
    }, {threshold: 0.05});
    observer.observe(ref.current);
    const onVisibility = () => setPageVisible(document.visibilityState !== 'hidden');
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreference = () => setReducedMotion(preference.matches);
    onPreference();
    preference.addEventListener('change', onPreference);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      preference.removeEventListener('change', onPreference);
    };
  }, []);

  return {ref, seen, reducedMotion, running: visible && pageVisible && !reducedMotion};
}

function ServiceTicker() {
  const {ref, seen, running, reducedMotion} = usePlayback();
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (reducedMotion) {
      track.style.removeProperty('transform');
      return;
    }
    if (!running) return;
    let frame = 0;
    let groupWidth = 0;
    let start = 0;
    const draw = () => {
      frame = 0;
      const distance = Math.max(0, window.scrollY - start) * 0.35;
      track.style.transform = `translate3d(${-distance % groupWidth}px, 0, 0)`;
    };
    const measure = () => {
      groupWidth = track.firstElementChild.getBoundingClientRect().width;
      start = ref.current.getBoundingClientRect().top + window.scrollY - window.innerHeight;
      draw();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const resize = new ResizeObserver(measure);
    resize.observe(track.firstElementChild);
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', measure);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, [running, reducedMotion]);

  return (
    <div className={styles.ticker} ref={ref} data-running={running}>
      <div className={styles.tickerViewport} aria-hidden="true">
        <div className={styles.tickerGlide} data-motion="ticker-glide" data-animate={seen}>
          <div ref={trackRef} className={styles.tickerTrack} data-motion="ticker-track">
            {[0, 1, 2].map((copy) => (
              <div key={copy} className={styles.tickerGroup} data-motion="ticker-group">
                {tickerItems.map((item) => (
                  <span key={item} className={styles.tickerItem}>
                    {item}<span className={styles.tickerDot} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AiConversation() {
  const {ref, running} = usePlayback();
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (running) setStarted(true);
  }, [running]);
  return (
    <div ref={ref} className={styles.aiDemo} data-running={running} data-animate={started}>
      <p className={styles.aiDemoLabel}>Пример диалога</p>
      <div className={styles.aiChat}>
        <div className={`${styles.bubble} ${styles.bubbleUser}`}>хочу что-нибудь к чаю</div>
        <div className={styles.bubble}>
          Нашёл 6 предложений рядом: эклеры −35% в 400 м, круассаны −40% у метро…
        </div>
        <div className={`${styles.bubble} ${styles.bubbleUser}`}>букет подруге вечером до 1000&nbsp;₽</div>
        <div className={styles.aiResponse}>
          <div className={`${styles.bubble} ${styles.bubbleTyping}`} aria-hidden="true">
            {[0, 1, 2].map((dot) => <span key={dot} data-motion="typing-dot" />)}
          </div>
          <div className={`${styles.bubble} ${styles.aiReply}`} data-motion="ai-reply">
              В цветочной в 600&nbsp;м есть букет за 890&nbsp;₽. Можно забрать сегодня с&nbsp;18:00 до&nbsp;20:00.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Данные ─── */
const tickerItems = [
  'СРОЧНЫЕ ПРЕДЛОЖЕНИЯ',
  'РЯДОМ С ВАМИ',
  'ВЫГОДНО',
  'БОГАТЫЙ АССОРТИМЕНТ',
  'БЫСТРО И ПРОСТО',
  'ЗАБРАЛ ЗА 20 СЕКУНД',
];

const stats = [
  {to: 40, prefix: '−', suffix: '%', label: 'средняя выгода'},
  {to: 10, suffix: ' км', label: 'радиус поиска'},
  {to: 20, suffix: ' сек', label: 'на бронирование'},
  {to: 5, suffix: '+', label: 'категорий рядом'},
];

const values = [
  {
    Icon: IconCard,
    tone: 'lime',
    title: 'Выгода',
    text: 'Помогаем экономить деньги — без компромиссов по качеству товаров и услуг.',
  },
  {
    Icon: IconPin,
    tone: 'green',
    title: 'Близость',
    text: 'Все предложения — рядом с вами. Покупка занимает минуты, а не часы.',
  },
  {
    Icon: IconZap,
    tone: 'forest',
    title: 'Скорость',
    text: 'Найти, оплатить и забрать — всего за несколько минут. Никаких лишних шагов.',
  },
  {
    Icon: IconLeaf,
    tone: 'mint',
    title: 'Разумное потребление',
    text: 'Хорошие товары находят покупателя вовремя. GrabYou делает потребление осознанным и выгодным для всех.',
  },
];

const steps = [
  {
    number: '01',
    Icon: IconPin,
    title: 'Открыл — сразу видно что рядом',
    description:
      'Лента показывает живые предложения поблизости прямо сейчас. Фото, цена, адрес и сколько времени осталось.',
  },
  {
    number: '02',
    Icon: IconCard,
    title: 'Нажал — оплатил — готово',
    description:
      'Буквально 20 секунд. Деньги замораживаются в защищённом резерве и спишутся только когда заберёшь. Риска ноль.',
  },
  {
    number: '03',
    Icon: IconQr,
    title: 'Пришёл — показал QR — ушёл',
    description:
      'Продавец сканирует твой QR за секунду. Никаких звонков, «подождите минуту» и лишних слов.',
  },
];

const categories = [
  {Icon: IconCoffee, label: 'Кофейни'},
  {Icon: IconBread, label: 'Пекарни'},
  {Icon: IconFood, label: 'Кафе и рестораны'},
  {Icon: IconFlower, label: 'Цветочные'},
  {Icon: IconStore, label: 'Магазины'},
];

/* Заведения на карте. x/y — проценты по viewBox карты.
   card — полная карточка над точкой, pill — компактная подпись сбоку.
   Раскладка посчитана скриптом по геометрии карты: точки стоят на суше
   и не на улицах, подписи не пересекаются и почти не закрывают реку.
   Размеры подписей в CSS заданы в единицах карты (cqw), поэтому
   раскладка верна на любой ширине. */
const mapPins = [
  {kind: 'card', x: 34.67, y: 25.7, tone: 'urgent', title: 'Кафе', deal: '−35%', meta: 'бизнес-ланч · 900 м'},
  {kind: 'card', x: 51.17, y: 20.04, tone: 'green', title: 'Кондитерская', deal: '−50%', meta: 'эклеры · 450 м'},
  {kind: 'card', x: 76.67, y: 20.04, tone: 'urgent', title: 'Кофейня', deal: '−30%', meta: 'до 21:00 · 350 м'},
  {kind: 'card', x: 21.67, y: 56.81, tone: 'lime', title: 'Пекарня', deal: '−45%', meta: 'круассаны · 600 м'},
  {kind: 'card', x: 43.17, y: 82.27, tone: 'lime', title: 'Суши-бар', deal: '−35%', meta: 'сеты · 1,1 км'},
  {kind: 'card', x: 76.17, y: 76.61, tone: 'route', title: 'Цветочный магазин', deal: '−40%', meta: 'букет дня · 1,2 км'},
  {kind: 'pill', x: 49.67, y: 47.62, side: 'r', tone: 'route', title: 'Пиццерия', deal: '−25%'},
  {kind: 'pill', x: 67.67, y: 44.08, side: 'r', tone: 'green', title: 'Магазин у дома', deal: '−20%'},
  {kind: 'pill', x: 60.67, y: 66.01, side: 'l', tone: 'urgent', title: 'Бургерная', deal: '−30%'},
  {kind: 'pill', x: 35.17, y: 46.91, side: 'r', tone: 'lime', title: 'Чайная', deal: '−25%'},
  {kind: 'pill', x: 47.67, y: 65.3, side: 'l', tone: 'green', title: 'Фермерская лавка', deal: '−35%'},
  {kind: 'pill', x: 57.17, y: 53.98, side: 'r', tone: 'route', title: 'Барбершоп', deal: '−40%'},
  {kind: 'pill', x: 45.17, y: 33.47, side: 'l', tone: 'urgent', title: 'Кулинария', deal: '−45%'},
  {kind: 'pill', x: 43.67, y: 55.4, side: 'r', tone: 'lime', title: 'Раменная', deal: '−30%'},
  {kind: 'pill', x: 83.67, y: 53.98, side: 'l', tone: 'route', title: 'Салон красоты', deal: '−30%'},
  {kind: 'pill', x: 18.17, y: 32.77, side: 'l', tone: 'green', title: 'Фруктовая лавка', deal: '−25%'},
  {kind: 'pill', x: 58.67, y: 39.13, side: 'r', tone: 'urgent', title: 'Пончиковая', deal: '−40%'},
  {kind: 'pill', x: 62.17, y: 49.03, side: 'r', tone: 'lime', title: 'Сырная лавка', deal: '−20%'},
];

export default function HomepageFeatures() {
  const promotionsImg = useBaseUrl('/img/grabyou/promotions_nearby.webp');
  const myOrderImg = useBaseUrl('/img/grabyou/my_order.webp');
  const qrScannerImg = useBaseUrl('/img/grabyou/qr_scanner.webp');
  const offerImg = useBaseUrl('/img/grabyou/offer-screen.webp');
  const paymentImg = useBaseUrl('/img/grabyou/payment-screen.webp');
  const aiPicImg = useBaseUrl('/img/grabyou/ai_pic.webp');

  return (
    <div className={styles.page}>

      {/* ═══ HERO ═══ */}
      <section className={styles.hero}>
        <div className={styles.heroMap} aria-hidden="true">
          <SpbMap className={styles.heroMapSvg} />
        </div>
        <div className={styles.heroFade} aria-hidden="true" />

        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.heroCard}>
              <Heading as="h1" className={styles.heroTitle}>
                Хватай
                <br />
                <span className={styles.heroTitleMark}>выгоду,</span>
                <br />
                пока горячо
              </Heading>
              <p className={styles.heroText}>
                GrabYou показывает, что прямо сейчас продаётся дешевле рядом с вами.
                Кофейни, пекарни, цветочные, кафе — предложения, которые нужно
                забрать сегодня.
              </p>
              <div className={styles.heroButtons}>
                <Link className={`button button--primary button--lg ${styles.primaryCta}`} to="/download">
                  Открыть GrabYou <IconArrow size={18} />
                </Link>
                <Link className="button button--secondary button--lg" to="#how-it-works">
                  Как это работает
                </Link>
              </div>
              <p className={styles.platformNote}>RuStore для Android · Telegram и VK на любом устройстве</p>
            </div>

            <div className={styles.heroVisual}>
              {/* плашки живут внутри телефонов: держатся у корпуса и сохраняют привязку при изменении размера */}
              <div className={styles.phone}>
                <img src={promotionsImg} alt="Лента предложений рядом в GrabYou" loading="eager" fetchPriority="high" width="816" height="1713" />
                <span className={`${styles.tag} ${styles.tagA}`}>−40%</span>
                <span className={`${styles.tag} ${styles.tagC}`}>осталось 2 шт.</span>
              </div>
              <div className={`${styles.phone} ${styles.phoneSmall}`}>
                <img src={qrScannerImg} alt="Выдача заказа по QR-коду" loading="lazy" width="816" height="1713" />
                <span className={`${styles.tag} ${styles.tagB}`}>350 м от вас</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ПОЛОСА СЕРВИСА ═══ */}
      <ServiceTicker />

      {/* ═══ ЦИФРЫ ═══ */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsRow}>
            {stats.map((s) => (
              <div key={s.label}>
                <div className={styles.statItem}>
                  <div className={styles.statNum}>
                    {s.prefix}{s.to}{s.suffix}
                  </div>
                  <div className={styles.statLabel}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ КАК ЭТО РАБОТАЕТ ═══ */}
      <section className={styles.section} id="how-it-works">
        <div className="container">
          <div>
            <header className={styles.sectionHead}>
              <Heading as="h2" className={styles.sectionTitle}>
                Три шага. Меньше минуты.
              </Heading>
              <p className={styles.sectionSub}>
                Никаких звонков менеджерам, подтверждений по почте и ожидания ответа.
              </p>
            </header>
          </div>

          <div className={styles.stepsGrid}>
            {steps.map((step) => (
              <div key={step.number}>
                <article className={styles.stepCard}>
                  <span className={styles.stepNum}>{step.number}</span>
                  <span className={styles.stepIcon}>
                    <step.Icon size={24} />
                  </span>
                  <Heading as="h3" className={styles.cardTitle}>
                    {step.title}
                  </Heading>
                  <p className={styles.cardText}>{step.description}</p>
                </article>
              </div>
            ))}
          </div>

          <div className={styles.shots} tabIndex={0} role="region" aria-label="Экраны приложения: предложение, оплата и заказ. Можно листать по горизонтали.">
            {[
              [offerImg, 'Карточка предложения'],
              [paymentImg, 'Оплата в приложении'],
              [myOrderImg, 'Мой заказ и QR-код'],
            ].map(([src, alt], i) => (
              <div key={alt}>
                <figure className={styles.shot}>
                  <span className={styles.shotNum}>0{i + 1}</span>
                  <img src={src} alt={alt} loading="lazy" width="816" height="1713" />
                </figure>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ЦЕННОСТИ ═══ */}
      <section className={styles.section}>
        <div className="container">
          <div>
            <header className={styles.sectionHead}>
              <Heading as="h2" className={styles.sectionTitle}>
                В основе GrabYou
              </Heading>
            </header>
          </div>
          <div className={styles.valuesGrid}>
            {values.map((v) => (
              <div key={v.title}>
                <article className={styles.valueCard} data-tone={v.tone}>
                  <span className={styles.valueIcon}>
                    <v.Icon size={24} />
                  </span>
                  <Heading as="h3" className={styles.cardTitle}>
                    {v.title}
                  </Heading>
                  <p className={styles.cardText}>{v.text}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ КАРТА — фирменный блок ═══ */}
      <section className={styles.section}>
        <div className="container">
          <div>
            <header className={styles.sectionHead}>
              <Heading as="h2" className={styles.sectionTitle}>
                Начинаем с Петербурга
              </Heading>
              <p className={styles.sectionSub}>
                Предложения привязаны к району, а не к городу. Видно, сколько идти
                и сколько осталось времени.
              </p>
            </header>
          </div>

          <div>
            <p className={styles.mapNote}>Пример предложений на карте. Актуальные цены и наличие — в приложении.</p>
            <div className={styles.mapCard}>
              <SpbMap className={styles.mapSvg} />
              <div className={styles.mapPins}>
                {mapPins.map((pin) => (
                  <div
                    key={pin.title}
                    className={pin.kind === 'card' ? styles.mapPin : styles.mapPill}
                    data-tone={pin.tone}
                    data-side={pin.side}
                    style={{left: `${pin.x}%`, top: `${pin.y}%`}}>
                    <span className={styles.mapPinDot} aria-hidden="true" />
                    {pin.kind === 'card' ? (
                      <div className={styles.mapPinCard}>
                        <span className={styles.mapPinDeal}>{pin.deal}</span>
                        <span className={styles.mapPinTitle}>{pin.title}</span>
                        <span className={styles.mapPinMeta}>{pin.meta}</span>
                      </div>
                    ) : (
                      <span className={styles.mapPillLabel}>
                        <b>{pin.deal}</b> {pin.title}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className={styles.mapLegend}>
                <span className={styles.mapLegendCity}>Санкт-Петербург</span>
                <span className={styles.mapLegendNote}>дальше — другие города</span>
              </div>
            </div>
          </div>

          {/* на узких экранах вместо подписей на карте — лента предложений */}
          <div className={styles.offerStrip} tabIndex={0} role="region" aria-label="Примеры предложений. Можно листать по горизонтали.">
            {mapPins.map((pin) => (
              <div key={pin.title} className={styles.offerChip} data-tone={pin.tone}>
                <span className={styles.offerDot} aria-hidden="true" />
                <span className={styles.offerDeal}>{pin.deal}</span>
                <span className={styles.offerTitle}>{pin.title}</span>
              </div>
            ))}
          </div>

          <div>
            <div className={styles.catRow}>
              {categories.map((c) => (
                <span key={c.label} className={styles.catChip}>
                  <c.Icon size={18} /> {c.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ GRABAI ═══ */}
      <section className={styles.section}>
        <div className="container">
          <div>
            <div className={styles.aiCard}>
              <div className={styles.aiContent}>
                <Heading as="h2" className={styles.aiTitle}>
                  GrabAI: не знаешь что хочешь?
                  <br />
                  Просто напиши
                </Heading>
                <p className={styles.cardText}>
                  Не нужно листать категории. Напиши текстом что ищешь — GrabAI
                  разберёт запрос и найдёт подходящие предложения рядом с тобой.
                </p>
                <AiConversation />
              </div>
              <div className={styles.aiVisual}>
                <img src={aiPicImg} alt="GrabAI" loading="lazy" width="816" height="1713" />
                <span className={`${styles.tag} ${styles.aiTagA}`}>нашёл 6 рядом</span>
                <span className={`${styles.tag} ${styles.aiTagB}`}>−35%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className={styles.section}>
        <div className="container">
          <div>
            <div className={styles.ctaCard}>
              <div className={styles.featureNote}>
                <IconClock size={16} /> Скоро запуск
              </div>
              <Heading as="h2" className={styles.ctaTitle}>
                Будь первым — узнай о старте раньше всех
              </Heading>
              <p className={styles.ctaText}>
                Подпишись на Telegram-канал GrabYou. Узнаешь когда запустимся,
                увидишь первые предложения в своём районе и получишь доступ
                раньше остальных.
              </p>
              <div className={styles.ctaButtons}>
                <Link className={`button button--primary button--lg ${styles.primaryCta}`} to="/download">
                  Открыть GrabYou <IconArrow size={18} />
                </Link>
                <Link
                  className="button button--secondary button--lg"
                  href="https://t.me/GrabYouOfficial"
                  target="_blank"
                  rel="noopener noreferrer">
                  Telegram-канал
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ПОМОЩЬ ═══ */}
      <section className={`${styles.section} ${styles.sectionLast}`}>
        <div className="container">
          <div>
            <div className={styles.helpCard}>
              <div>

                <Heading as="h2" className={styles.helpTitle}>
                  Не нашли то, что нужно?
                  <br />
                  Мы вам поможем
                </Heading>
                <p className={styles.cardText}>
                  Ответим на любые вопросы, расскажем подробнее о сервисе
                  и отправим всё необходимое. Обычно отвечаем быстро.
                </p>
              </div>
              <div className={styles.helpLinks}>
                <Link
                  href="https://t.me/GrabYouOfficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.helpLink}>
                  <IconTelegram size={20} />
                  Telegram-канал
                </Link>
                <Link href="mailto:grabyou@mail.ru" className={styles.helpLink}>
                  <IconMail size={20} />
                  grabyou@mail.ru
                </Link>
                <Link to="/partners" className={styles.helpLink}>
                  <IconCheck size={20} />
                  Стать партнёром
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
