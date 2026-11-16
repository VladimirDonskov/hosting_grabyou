import {useEffect, useRef, useState} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  IconBread,
  IconCheck,
  IconClock,
  IconCoffee,
  IconFlower,
  IconFood,
  IconMail,
  IconRuble,
  IconShield,
  IconStore,
  IconTelegram,
  IconUsers,
} from '@site/src/components/brand/icons';
import styles from './partners.module.css';

const benefits = [
  {
    Icon: IconRuble,
    tone: 'lime',
    title: 'Дополнительная выручка',
    text: 'Каждая позиция и каждый свободный час работают на кассу. Вечерняя выпечка, свободные окна записи, сезонные предложения — всё находит своего покупателя вовремя.',
    featured: true,
  },
  {
    Icon: IconUsers,
    tone: 'green',
    title: 'Новые клиенты рядом',
    text: 'Вас находят люди, которые живут и работают в вашем районе — и возвращаются уже за полной ценой.',
  },
  {
    Icon: IconShield,
    tone: 'forest',
    title: 'Оплата гарантирована',
    text: 'Клиент платит в приложении при бронировании. Деньги замораживаются в резерве — никаких «передумал и не пришёл» за ваш счёт.',
  },
  {
    Icon: IconClock,
    tone: 'mint',
    title: 'Управление спросом',
    text: 'Сами решаете что, когда и по какой цене предложить. Заполняйте тихие часы и распродавайте к закрытию — без демпинга основного меню.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Регистрируетесь',
    text: 'Создаёте профиль заведения: название, адрес, категория. Это бесплатно и занимает пару минут.',
  },
  {
    number: '02',
    title: 'Публикуете предложение',
    text: 'Фото, цена, количество и время выдачи. Предложение мгновенно видят пользователи рядом с вами.',
  },
  {
    number: '03',
    title: 'Клиент бронирует и платит',
    text: 'Оплата проходит в приложении и хранится в защищённом резерве до выдачи заказа.',
  },
  {
    number: '04',
    title: 'Сканируете QR — деньги ваши',
    text: 'Клиент приходит, вы сканируете его QR-код. Секунда — и заказ выдан, оплата зачислена.',
  },
];

const categories = [
  {Icon: IconCoffee, label: 'Кофейни'},
  {Icon: IconBread, label: 'Пекарни'},
  {Icon: IconFood, label: 'Кафе и рестораны'},
  {Icon: IconFlower, label: 'Цветочные'},
  {Icon: IconStore, label: 'Магазины'},
];

const faq = [
  {
    q: 'Сколько стоит подключение?',
    a: 'Подключение и размещение предложений бесплатны. Мы зарабатываем только тогда, когда зарабатываете вы — небольшая комиссия с успешно выданных заказов.',
  },
  {
    q: 'Что если клиент не придёт за заказом?',
    a: 'Деньги уже заморожены в резерве при бронировании, поэтому вы ничего не теряете. Правила выплат по невыкупленным заказам фиксируются в договоре.',
  },
  {
    q: 'Не обесценит ли это моё основное меню?',
    a: 'Нет. Вы предлагаете ограниченное количество позиций в конкретные часы — например, к закрытию. Это инструмент точечных предложений, а не постоянная скидка.',
  },
  {
    q: 'Какое оборудование нужно?',
    a: 'Только смартфон. Публикация предложений и сканирование QR-кодов работают из приложения партнёра.',
  },
];

/* ─── Модалка-анкета ─── */
function PartnerFormModal({open, motion, onClose}) {
  const {siteConfig} = useDocusaurusContext();
  const dialogRef = useRef(null);
  const successRef = useRef(null);
  const [form, setForm] = useState({name: '', address: '', phone: '', email: ''});
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    dialog.querySelector('input[name="name"]')?.focus({preventScroll: true});
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open && status === 'success') successRef.current?.focus();
  }, [open, status]);

  const close = () => {
    // Keep an unfinished draft (and an in-flight request) when closing.
    // A received application is cleared only after its confirmation is dismissed.
    if (status === 'success') {
      setForm({name: '', address: '', phone: '', email: ''});
      setConsent(false);
      setStatus('idle');
    }
    onClose();
  };

  const set = (key) => (e) => {
    e.target.setCustomValidity('');
    setForm({...form, [key]: e.target.value});
    if (status === 'error') setStatus('idle');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consent || status === 'sending') return;
    const data = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
    for (const [key, value] of Object.entries(data)) {
      const input = e.currentTarget.elements.namedItem(key);
      input.setCustomValidity(value ? '' : 'Введите значение — одних пробелов недостаточно.');
      if (!input.reportValidity()) return;
    }
    const phone = e.currentTarget.elements.namedItem('phone');
    const digits = data.phone.replace(/\D/g, '');
    phone.setCustomValidity(/^[+\d\s().-]+$/.test(data.phone) && digits.length >= 7 && digits.length <= 15
      ? '' : 'Введите номер телефона: от 7 до 15 цифр, можно с кодом страны.');
    if (!phone.reportValidity()) return;
    setForm(data);
    setStatus('sending');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(siteConfig.customFields.partnerApiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      const json = await res.json().catch(() => ({}));
      setStatus(res.ok && json.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    } finally {
      window.clearTimeout(timeout);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      data-motion={motion}
      aria-labelledby="partner-form-title"
      aria-describedby="partner-form-description"
      onCancel={(e) => {e.preventDefault(); close();}}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const rect = e.currentTarget.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) close();
      }}>
        <button type="button" className={styles.modalClose} onClick={close} aria-label="Закрыть форму">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>

        {status === 'success' ? (
          <div>
            <span className={styles.successIcon} aria-hidden="true"><IconCheck size={28} /></span>
            <h2 id="partner-form-title" className={styles.modalTitle} tabIndex={-1} ref={successRef}>
              Заявка отправлена!
            </h2>
            <p id="partner-form-description" className={styles.modalSub} role="status">
              Спасибо! Мы получили вашу заявку и свяжемся с вами в ближайшее время.
              Если хотите ускорить — напишите нам в{' '}
              <Link href="https://t.me/GrabYouOfficial" target="_blank" rel="noopener noreferrer">
                Telegram
              </Link>
              .
            </p>
            <button type="button" className={styles.submit} onClick={close}>
              Отлично
            </button>
          </div>
        ) : (
          <>
            <h2 id="partner-form-title" className={styles.modalTitle}>
              Стать партнёром
            </h2>
            <p id="partner-form-description" className={styles.modalSub}>
              Оставьте заявку — мы свяжемся с вами и подробно расскажем про формат,
              условия и первые шаги.
            </p>

            <form onSubmit={handleSubmit} className={styles.form} aria-busy={status === 'sending'}>
              <p className={styles.formHint}>Все поля обязательны</p>
              <label className={styles.label}>
                Название кафе / ресторана / магазина
                <input
                  className={styles.input}
                  type="text"
                  name="name"
                  autoComplete="organization"
                  autoFocus
                  maxLength={300}
                  readOnly={status === 'sending'}
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Например, «Пекарня на Лиговском»"
                />
              </label>

              <label className={styles.label}>
                Город / адрес торговой точки
                <input
                  className={styles.input}
                  type="text"
                  name="address"
                  autoComplete="street-address"
                  maxLength={300}
                  readOnly={status === 'sending'}
                  required
                  value={form.address}
                  onChange={set('address')}
                  placeholder="Санкт-Петербург, Лиговский пр., 30"
                />
              </label>

              <label className={styles.label}>
                Номер телефона
                <input
                  className={styles.input}
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  maxLength={300}
                  readOnly={status === 'sending'}
                  required
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+7 (900) 000-00-00"
                />
              </label>

              <label className={styles.label}>
                Email
                <input
                  className={styles.input}
                  type="email"
                  name="email"
                  autoComplete="email"
                  maxLength={300}
                  readOnly={status === 'sending'}
                  required
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                />
              </label>

              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={status === 'sending'}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                />
                <span>Даю согласие на обработку персональных данных</span>
              </label>

              {status === 'error' && (
                <p className={styles.error} role="alert">
                  Не получилось отправить. Попробуйте ещё раз или напишите нам в{' '}
                  <Link href="https://t.me/GrabYouOfficial" target="_blank" rel="noopener noreferrer">
                    Telegram
                  </Link>{' '}
                  /{' '}
                  <Link href="mailto:grabyou@mail.ru">на почту</Link>.
                </p>
              )}

              <p className={styles.formStatus} role="status">{status === 'sending' ? 'Отправляем заявку. Это может занять несколько секунд.' : ''}</p>
              <button type="submit" className={styles.submit} disabled={status === 'sending'}>
                {status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
              </button>
            </form>
          </>
        )}
    </dialog>
  );
}

export default function PartnersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [formMotion, setFormMotion] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);
  const openForm = (e) => {
    setFormMotion(e.detail > 0);
    setFormOpen(true);
  };

  return (
    <Layout
      title="Партнёрам"
      description="Станьте партнёром GrabYou: превращайте свободные часы и горящие предложения в выручку и новых клиентов">
      <main className={styles.page}>
        <div className="container">
          {/* ─── HERO ─── */}
          <section className={styles.hero}>
            <div className={styles.heroCard}>
              <Heading as="h1" className={styles.heroTitle}>
                Превращайте горящие предложения в{' '}
                <span className={styles.heroMark}>выручку</span>
              </Heading>
              <p className={styles.heroSub}>
                GrabYou приводит покупателей из вашего района на предложения,
                которые нужно продать именно сегодня. Без затрат на рекламу,
                без рисков, с оплатой вперёд.
              </p>
              <div className={styles.heroCtas}>
                <button
                  type="button"
                  className="button button--primary button--lg"
                  onClick={openForm}>
                  Стать партнёром
                </button>
                <Link className="button button--secondary button--lg" to="#how">
                  Как это работает
                </Link>
              </div>
              <div className={styles.chips}>
                <span className={styles.chip}>0 ₽ за подключение</span>
                <span className={styles.chip}>оплата до выдачи</span>
                <span className={styles.chip}>клиенты из вашего района</span>
              </div>
            </div>
          </section>

          {/* ─── ВЫГОДЫ ─── */}
          <section className={styles.section}>
            <header className={styles.sectionHead}>
              <Heading as="h2" className={styles.sectionTitle}>
                Бизнесу это приносит деньги
              </Heading>
            </header>
            <div className={styles.benefitsGrid}>
              {benefits.map((b) => (
                <article
                  key={b.title}
                  className={`${styles.card} ${b.featured ? styles.cardFeatured : ''}`}
                  data-tone={b.tone}>
                  <span className={styles.cardIcon}>
                    <b.Icon size={24} />
                  </span>
                  <Heading as="h3" className={styles.cardTitle}>
                    {b.title}
                  </Heading>
                  <p className={styles.cardText}>{b.text}</p>
                </article>
              ))}
            </div>
          </section>

          {/* ─── КАК РАБОТАЕТ ─── */}
          <section className={styles.section} id="how">
            <header className={styles.sectionHead}>
              <Heading as="h2" className={styles.sectionTitle}>
                Четыре шага до первой продажи
              </Heading>
            </header>
            <ol className={styles.stepsGrid}>
              {steps.map((s) => (
                <li key={s.number} className={styles.stepCard}>
                  <span className={styles.stepNum}>{s.number}</span>
                  <Heading as="h3" className={styles.cardTitle}>
                    {s.title}
                  </Heading>
                  <p className={styles.cardText}>{s.text}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* ─── КОМУ ПОДХОДИТ ─── */}
          <section className={styles.section}>
            <header className={styles.sectionHead}>
              <Heading as="h2" className={styles.sectionTitle}>
                Любой бизнес с «горящими» позициями
              </Heading>
            </header>
            <div className={styles.catRow}>
              {categories.map((c) => (
                <span key={c.label} className={styles.catChip}>
                  <c.Icon size={18} /> {c.label}
                </span>
              ))}
            </div>
            <p className={styles.catNote}>
              Свежая выпечка к вечеру, букеты дня, свободные окна записи,
              бизнес-ланчи в тихие часы — если у вас бывает то, что нужно продать
              сегодня, GrabYou найдёт на это покупателя.
            </p>
          </section>

          {/* ─── FAQ ─── */}
          <section className={styles.section}>
            <header className={styles.sectionHead}>
              <Heading as="h2" className={styles.sectionTitle}>
                Коротко о главном
              </Heading>
            </header>
            <div className={styles.faqList}>
              {faq.map((f, i) => (
                <div key={f.q} className={`${styles.faqItem} ${faqOpen === i ? styles.faqOpen : ''}`}>
                  <button
                    type="button"
                    className={styles.faqQ}
                    id={`partner-faq-question-${i}`}
                    aria-expanded={faqOpen === i}
                    aria-controls={`partner-faq-answer-${i}`}
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                    <span className={styles.faqText}>{f.q}</span>
                    <span className={styles.faqPlus} aria-hidden="true" />
                  </button>
                  <div className={styles.faqAWrap} id={`partner-faq-answer-${i}`} role="region" aria-labelledby={`partner-faq-question-${i}`} hidden={faqOpen !== i}>
                    <p className={styles.faqA}>{f.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── CTA ─── */}
          <section className={`${styles.section} ${styles.sectionLast}`}>
            <div className={styles.ctaCard}>
              <Heading as="h2" className={styles.ctaTitle}>
                Станьте партнёром GrabYou
              </Heading>
              <p className={styles.ctaText}>
                Напишите нам — расскажем условия, поможем с регистрацией
                и первым предложением. Это займёт один день.
              </p>
              <div className={styles.ctaButtons}>
                <button
                  type="button"
                  className="button button--primary button--lg"
                  onClick={openForm}>
                  Оставить заявку
                </button>
                <Link
                  className={styles.ctaLink}
                  href="https://t.me/GrabYouOfficial"
                  target="_blank"
                  rel="noopener noreferrer">
                  <IconTelegram size={18} /> Написать в Telegram
                </Link>
                <Link className={styles.ctaLink} href="mailto:grabyou@mail.ru">
                  <IconMail size={18} /> grabyou@mail.ru
                </Link>
              </div>
            </div>
          </section>
        </div>

        <PartnerFormModal open={formOpen} motion={formMotion} onClose={() => setFormOpen(false)} />
      </main>
    </Layout>
  );
}
