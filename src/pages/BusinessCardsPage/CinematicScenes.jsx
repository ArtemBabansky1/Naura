import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import { scheduleScrollRefresh } from '../../lib/scrollRefresh'
import { APP_URL } from '../../lib/urls'
import heroPhoto from '../../assets/business-cards-redesign/hero-720.webp'
import meetingPhoto from '../../assets/business-cards-redesign/contact-1.webp'
import eventPhoto from '../../assets/business-cards-redesign/contact-4.webp'
import conferencePhoto from '../../assets/business-cards-redesign/conference-networking.webp'
import conversationPhoto from '../../assets/business-cards-redesign/access-1200.webp'
import gatheringPhoto from '../../assets/business-cards-redesign/instant-networking.webp'
import portrait from '../../assets/business-cards-redesign/contact-2.webp'
import { EditorialTitle } from './EditorialTitle'
import { ChevronRight } from '../../components/ChevronRight/ChevronRight'
import { NauraLogo } from '../../components/NauraLogo/NauraLogo'
import './CinematicScenes.css'
import { CardConnectionStory } from './CardConnectionStory'
import { bookSurfacePath } from './connectionFolder'

const EASE = [0.22, 1, 0.36, 1]
const HERO_PORTAL_COMPLETE = 0.25
const COLLECTION_START = 0.43
const COLLECTION_SPEED = 2
const COLLECTION_DURATION = 1 - COLLECTION_START
const HERO_TIMELINE_LENGTH = COLLECTION_START + COLLECTION_DURATION / COLLECTION_SPEED
// Keep every scroll viewport tied to visible motion: intro/profile, a short
// reading beat, then the collection transition and its settled book state.
const HERO_SCROLL_HEIGHT = `${100 + 360 * HERO_TIMELINE_LENGTH}svh`

// Interaction phases retain their original choreography coordinates.
const heroChoreographyProgress = (scrollProgress) => {
  const time = scrollProgress * HERO_TIMELINE_LENGTH
  return time <= COLLECTION_START ? time : COLLECTION_START + (time - COLLECTION_START) * COLLECTION_SPEED
}
const SAMPLE_CODE_PATH = Array.from({ length: 625 }, (_, i) => {
  const x = i % 25 + 2, y = Math.floor(i / 25) + 2
  if ((x < 10 && y < 10) || (x > 18 && y < 10) || (x < 10 && y > 18)) return ''
  return (x * 7 + y * 11 + x * y) % 9 < 4 ? `M${x} ${y}h1v1h-1z` : ''
}).join('')

// A decorative sample; the adjacent link, rather than this pattern, opens Naura.
export function SampleCode({ className = 'nc-code', ...svgProps } = {}) {
  return <svg className={className} viewBox="0 0 29 29" aria-hidden="true" {...svgProps}>
    <rect width="29" height="29" rx="2" fill="var(--bc-paper)" />
    <g fill="var(--bc-ink)">
      {[ [2,2], [20,2], [2,20] ].map(([x,y]) => <g key={`${x}-${y}`}><path d={`M${x} ${y}h7v7h-7z M${x+1} ${y+1}v5h5v-5z`} fillRule="evenodd" /><rect x={x+2} y={y+2} width="3" height="3" /></g>)}
      <path d={SAMPLE_CODE_PATH} />
    </g>
  </svg>
}

export function IdentityCard({ theme = 'paper', interactive = false, enabled = true, compact = false, variant = 'classic' }) {
  const { t } = useTranslation('businessCards')
  const [flipped, setFlipped] = useState(false)
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const pointerType = useRef('mouse')
  const isFlipped = interactive && enabled && flipped
  useEffect(() => { if (!enabled) setFlipped(false) }, [enabled])
  const enter = (event) => {
    if (variant !== 'profile' && interactive && enabled && event.pointerType === 'mouse') setFlipped(true)
  }
  const tilt = (event) => {
    if (!interactive || !enabled || reduced || event.pointerType !== 'mouse') return
    const box = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--tilt-x', `${-(event.clientY-box.top-box.height/2)/30}deg`)
    ref.current.style.setProperty('--tilt-y', `${(event.clientX-box.left-box.width/2)/25}deg`)
  }
  const reset = (event) => {
    ref.current?.style.setProperty('--tilt-x', '0deg')
    ref.current?.style.setProperty('--tilt-y', '0deg')
    if (variant !== 'profile' && event.pointerType === 'mouse') setFlipped(false)
  }
  return <div ref={ref} className={`nc-identity nc-identity--${theme}${variant === 'profile'?' nc-identity--profile':''}${compact?' nc-identity--compact':''}${isFlipped?' is-flipped':''}`} onPointerEnter={enter} onPointerMove={tilt} onPointerLeave={reset} onPointerCancel={reset}>
    <div className="nc-identity__rotor" aria-hidden={interactive ? true : undefined}>
      <div className="nc-identity__face nc-identity__front" aria-hidden={isFlipped}>
        {variant === 'profile' ? <>
          <svg className="nc-identity__lines" viewBox="0 0 1600 900" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false">
            <ellipse cx="800" cy="470" rx="790" ry="335" transform="rotate(-15 800 470)" />
            <ellipse cx="800" cy="490" rx="860" ry="280" transform="rotate(14 800 490)" />
            <ellipse cx="800" cy="525" rx="930" ry="220" transform="rotate(-5 800 525)" />
          </svg>
          <div className="nc-identity__profile-brand"><NauraLogo width={85} /></div>
          <div className="nc-identity__profile-person">
            <div className="nc-identity__portrait"><img src={heroPhoto} alt="" /></div>
            <div className="nc-identity__name">{t('hero.profile.name')}</div>
            <p className="nc-identity__role">{t('hero.profile.role')}</p>
          </div>
          <div className="nc-identity__profile-details">
            <span>{t('hero.profile.company')}<span>{t('hero.profile.email')}</span></span>
            <span className="nc-identity__profile-address">naura.io / aya</span>
          </div>
          <div className="nc-identity__profile-action">
            <span className="nc-identity__action-track"><span className="nc-identity__action-knob"><ChevronRight /></span></span>
            <span className="nc-identity__action-label">{t('cinematic.openContacts')}</span>
            <span className="nc-identity__action-hover-label">{t('cinematic.makeConnection')}</span>
          </div>
        </> : <>
        <div className="nc-identity__brand"><NauraLogo width={112} /><span>PERSONAL CARD</span></div>
        <div className="nc-identity__person"><div className="nc-identity__portrait"><img src={heroPhoto} alt="" /></div><span><ChevronRight /></span></div>
        <div className="nc-identity__name">{t('hero.profile.name')}</div>
        <p className="nc-identity__role">{t('hero.profile.role')}</p>
        <div className="nc-identity__bottom"><div><span>{t('cinematic.cardHint')}</span><strong>naura.io / aya</strong></div><SampleCode /></div>
        </>}
      </div>
      <div className="nc-identity__face nc-identity__back" aria-hidden={!isFlipped}>
        <span className="nc-identity__back-brand"><NauraLogo variant="mark" width={32} />LET’S CONNECT</span><SampleCode /><strong>{t('hero.profile.name')}</strong><p>{t('cinematic.demo')}</p><span className="nc-identity__profile">naura.io / aya <ChevronRight /></span>
      </div>
    </div>
    {interactive && <button
      className="nc-identity__surface"
      type="button"
      disabled={!enabled}
      aria-hidden={!enabled}
      aria-label={`${t(variant === 'profile' && !isFlipped ? 'cinematic.openContacts' : 'cinematic.flip')}: ${t('hero.profile.name')}`}
      aria-pressed={isFlipped}
      onPointerDown={event => { pointerType.current = event.pointerType }}
      onClick={event => { if (variant === 'profile' || event.detail === 0 || pointerType.current !== 'mouse') setFlipped(value => !value) }}
      onKeyDown={event => { if (event.key === 'Escape') setFlipped(false) }}
      onBlur={() => setFlipped(false)}
    />}
  </div>
}

export function CinematicHero({ Action }) {
  const { t } = useTranslation('businessCards')
  const reduced = useReducedMotion()
  const root = useRef(null)
  const exitSpace = useRef(null)
  const [cardReady, setCardReady] = useState(false)
  const words = t('cinematic.heroLines', {returnObjects:true})
  useLayoutEffect(() => {
    const scene = root.current
    const stage = scene.querySelector('.nc-hero__stage')
    const card = scene.querySelector('.nc-hero__card')
    const intro = scene.querySelector('.nc-hero__intro')
    const story = scene.querySelector('.nc-card-story')
    const book = scene.querySelector('.nc-connection__book')
    const bookCopy = scene.querySelector('.nc-connection__copy')
    const media = gsap.matchMedia()

    media.add({
      all: '(min-width: 0px)',
      animate: '(prefers-reduced-motion: no-preference) and (min-height: 650px)',
      mobile: '(max-width: 767px)',
    }, ({ conditions }) => {
      scene.dataset.connectionMotion = 'static'
      intro.inert = false
      bookCopy.inert = false
      if (reduced || !conditions.animate) {
        setCardReady(true)
        return
      }
      scene.dataset.connectionMotion = 'animated'
      const mobile = conditions.mobile
      const folderWidth = () => Math.min(520, book.clientWidth)
      const folderHeight = () => Math.min(folderWidth() * 0.78, stage.clientHeight * 0.55)
      // Enlarged text must remain readable instead of being clipped by a pin.
      if (story.offsetTop + story.offsetHeight > stage.clientHeight - 20 ||
          bookCopy.offsetTop + bookCopy.offsetHeight > stage.clientHeight - 20) {
        scene.dataset.connectionMotion = 'static'
        setCardReady(true)
        return
      }
      setCardReady(false)
      bookCopy.inert = true
      let lastReady = false
      let lastPhase = ''
      const context = gsap.context(() => {
        gsap.set('.nc-card-story .bc2-title-word > span, .nc-card-story > p', {
          opacity: 0, filter: 'blur(6px)',
        })
        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: scene, start: 'top top', end: 'bottom bottom',
            scrub: true, invalidateOnRefresh: true,
            onUpdate: ({ progress: scrollProgress }) => {
              const progress = heroChoreographyProgress(scrollProgress)
              const ready = progress >= HERO_PORTAL_COMPLETE && progress < 0.60
              if (ready !== lastReady) { lastReady = ready; setCardReady(ready) }
              const phase = progress < 0.25 ? 'intro' : progress < 0.56 ? 'profile' : progress < 0.92 ? 'collect' : 'book'
              if (phase !== lastPhase) {
                lastPhase = phase
                scene.dataset.connectionPhase = phase
                intro.inert = phase !== 'intro'
                bookCopy.inert = phase !== 'book'
              }
            },
          },
        })
        timeline
          .to(intro, { y: -100, autoAlpha: 0, scale: 0.94, duration: 0.12 }, 0)
          .to('.nc-hero__satellite', { xPercent: i => i % 2 ? -80 : 80, yPercent: -80, rotation: 0, scale: 0.4, opacity: 0, stagger: 0.005, duration: 0.15, ease: 'power2.in' }, 0)
          .to('.nc-hero__rings', { scale: 0.4, rotation: 55, opacity: 0, duration: 0.16 }, 0)
          .fromTo('.nc-hero__portal',
            { y: 0, yPercent: 105, '--portal-inset': '22%', '--portal-radius': '60px' },
            { y: 0, yPercent: 0, '--portal-inset': '0%', '--portal-radius': '0px', duration: 0.20, ease: 'power2.inOut' }, 0.05)
          .set(scene, { attr: { 'data-hero-surface': 'ink' } }, HERO_PORTAL_COMPLETE)
          // Preserve the original card node and the centered axis throughout.
          .to(card, {
            x: 0, y: () => stage.clientHeight * 0.68 - card.offsetTop,
            yPercent: -50, rotation: -6,
            scale: () => Math.min(mobile ? 0.85 : 1.1, stage.clientHeight * (mobile ? 0.36 : 0.42) / card.offsetHeight),
            duration: 0.23, ease: 'power2.inOut',
          }, 0.05)
          .fromTo(story, { y: 0, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.025 }, 0.26)
          .fromTo('.nc-card-story .bc2-title-word > span',
            { opacity: 0, filter: 'blur(6px)' },
            { opacity: 1, filter: 'blur(0px)', duration: 0.075, stagger: 0.005, ease: 'power2.out' }, 0.27)
          .fromTo('.nc-card-story > p',
            { opacity: 0, filter: 'blur(6px)' },
            { opacity: 1, filter: 'blur(0px)', duration: 0.08, stagger: 0.035, ease: 'power2.out' }, 0.26)

        // Capture, whitening and expansion share an overlapping interval. The
        // vessel starts opening while the card still carries downward momentum;
        // only the finished book settles. Keep the total scroll distance intact.
        const collection = gsap.timeline({ defaults: { ease: 'none' } })
        const captureAt = 0.26
        const openAt = captureAt + 0.005
        const openDuration = 0.255
        const paperReadyAt = 0.45
        collection
          // As the text leaves, lift the card above its centered landing point.
          .to(story, { y: () => -stage.clientHeight * 0.65, autoAlpha: 0, duration: 0.13, ease: 'power1.in' }, 0)
          .to(card, {
            y: () => stage.clientHeight * 0.34 - card.offsetTop,
            duration: 0.14, ease: 'power2.inOut',
          }, 0)
          // Start compact and entirely below the screen, then grow during entry.
          .fromTo(stage, {
            '--stage-width': () => `${stage.clientWidth}px`,
            '--stage-height': () => `${stage.clientHeight}px`,
            '--vessel-width': () => `${folderWidth() * 0.55}px`,
            '--vessel-height': () => `${folderHeight() * 0.55}px`,
            '--vessel-y': () => `${stage.clientHeight + folderHeight() * 0.55 / 2 + 50}px`,
          }, {
            '--stage-width': () => `${stage.clientWidth}px`,
            '--stage-height': () => `${stage.clientHeight}px`,
            '--vessel-width': () => `${folderWidth()}px`,
            '--vessel-height': () => `${folderHeight()}px`,
            '--vessel-y': () => `${stage.clientHeight * 0.5}px`,
            duration: 0.21, ease: 'power2.out',
          }, 0.05)
          .set('.nc-connection__glass, .nc-connection__folder-back', { autoAlpha: 1 }, 0.05)
          .to(card, {
            y: () => stage.clientHeight * 0.5 - card.offsetTop,
            rotation: 0,
            duration: 0.13, ease: 'power1.inOut',
          }, 0.15)
          .to(card, { scale: mobile ? 0.48 : 0.50, duration: 0.11, ease: 'power1.inOut' }, 0.15)
          .fromTo(card, { filter: 'blur(0px) brightness(1) saturate(1)' }, {
            filter: 'blur(8px) brightness(1) saturate(1)', duration: 0.05, ease: 'none',
          }, 0.21)
          .to('.nc-connection__glass', { '--connection-blur': '35px', duration: 0.14 }, 0.21)
          // Once fully inside, clip the SAME travelling card to the vessel.
          // Shared coordinates keep the glass and clipping edge precisely aligned.
          // An explicit start value releases the mask on reverse playback too.
          .fromTo('.nc-card-flight', { attr: { 'data-clipped': 'false' } }, {
            attr: { 'data-clipped': 'true' }, duration: 0, immediateRender: false,
          }, captureAt)
          .to('.nc-connection__count-before', { yPercent: -100, opacity: 0, duration: 0.045, ease: 'power2.inOut' }, captureAt)
          .fromTo('.nc-connection__count-after', { y: 0, yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.045, ease: 'power2.inOut' }, captureAt)
          // Its own paper surface spreads; no replacement rectangle or crossfade.
          // Overscan lets the original card's blurred center reach every glass edge.
          .to(card, {
            scaleX: () => folderWidth() * 2.6 / card.offsetWidth,
            scaleY: () => folderHeight() * 3 / card.offsetHeight,
            filter: 'blur(40px) brightness(1.8) saturate(0.2)',
            duration: paperReadyAt - captureAt, ease: 'power1.inOut',
          }, captureAt)
          .to('.nc-connection__glass', { '--connection-frost': 0, duration: 0.12, ease: 'sine.inOut' }, 0.29)
          .to('.nc-connection__folder-labels', { autoAlpha: 0, duration: 0.09, ease: 'power1.inOut' }, 0.315)
          // The surface becomes opaque DURING expansion, so there is no white
          // folder hold. Remove the travelling card only behind the opaque face.
          .to('.nc-connection__glass', { '--connection-paper': 1, duration: 0.135, ease: 'sine.inOut' }, 0.30)
          .fromTo('.nc-connection__glass', { attr: { 'data-material': 'glass' } }, { attr: { 'data-material': 'paper' }, duration: 0, immediateRender: false }, paperReadyAt)
          .set(card, { autoAlpha: 0 }, paperReadyAt)
          .set(card, { filter: 'none' }, paperReadyAt + 0.001)
          // One long ease carries both walls and their outline into the book.
          .to('.nc-folder-shape', { attr: { d: () => bookSurfacePath(book.clientWidth, book.clientHeight, mobile ? 25 : 30) }, duration: openDuration, ease: 'sine.inOut' }, openAt)
          .to(stage, {
            '--vessel-width': () => `${book.clientWidth}px`,
            '--vessel-height': () => `${book.clientHeight}px`,
            '--vessel-y': () => `${book.offsetTop}px`,
            duration: openDuration, ease: 'sine.inOut',
          }, openAt)
          .fromTo('.nc-connection__pages', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.085, ease: 'sine.out' }, 0.455)
          .fromTo('.nc-connection__pages', { '--book-edge': 0 }, { '--book-edge': 1, duration: 0.03 }, openAt + openDuration)
          .fromTo('.nc-connection__detail', { autoAlpha: 0, x: 25, y: 30 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.09, ease: 'power2.out' }, 0.46)
          .fromTo(bookCopy, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.08, ease: 'sine.out' }, 0.465)
          .set({}, {}, COLLECTION_DURATION)
        timeline.add(collection.timeScale(COLLECTION_SPEED), COLLECTION_START)
      }, scene)
      return () => {
        context.revert()
        intro.inert = false
        bookCopy.inert = false
        scene.dataset.connectionMotion = 'static'
        delete scene.dataset.connectionPhase
      }
    }, scene)
    // Keep a stable seam between dark and light sections to preserve the intended
    // transition rhythm while animated block exits.
    const updateExitSpace = () => {
      const inset = window.innerWidth < 768 ? 25 : 50
      const heightValue = `${scene.dataset.connectionMotion === 'animated' ? inset : 0}px`
      if (exitSpace.current.style.height !== heightValue) {
        exitSpace.current.style.height = heightValue
        scheduleScrollRefresh()
      }
    }
    const exitObserver = new ResizeObserver(updateExitSpace)
    exitObserver.observe(stage)
    exitObserver.observe(bookCopy)
    updateExitSpace()
    scheduleScrollRefresh()
    return () => {
      exitObserver.disconnect()
      media.revert()
    }
  }, [reduced])
  return <><section ref={root} className={`nc-hero nc-hero--connection${reduced?' nc-hero--reduced':''}`} style={{ '--hero-scroll-height': HERO_SCROLL_HEIGHT }} data-hero-surface="canvas" data-connection-motion="static" id="top" aria-labelledby="nc-hero-title">
    <div className="nc-hero__stage">
      <div className="nc-hero__rings" aria-hidden="true">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="none" fill="none">
          <ellipse cx="800" cy="470" rx="790" ry="335" transform="rotate(-15 800 470)" pathLength="1" />
          <ellipse cx="800" cy="490" rx="860" ry="280" transform="rotate(14 800 490)" pathLength="1" />
          <ellipse cx="800" cy="525" rx="930" ry="220" transform="rotate(-5 800 525)" pathLength="1" />
        </svg>
      </div>
      <div className="nc-hero__intro">
        <EditorialTitle as="h1" id="nc-hero-title" text={t("hero.title")} lines={words} accent={words.at(-1)} />
        <motion.div initial={reduced?false:{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:0.7,delay:0.45,ease:EASE}}><p className="nc-hero__description">{t('hero.subtitle')}</p><Action href={APP_URL}>{t('hero.cta')}</Action></motion.div>
      </div>
      {[
        ['one', meetingPhoto], ['two', conferencePhoto],
        ['three', conversationPhoto], ['four', gatheringPhoto],
      ].map(([position, photo]) => <div className={`nc-hero__entrance nc-hero__entrance--${position}`} key={position} aria-hidden="true">
        <div className={`nc-hero__satellite nc-hero__satellite--${position}`}><img src={photo} alt=""/></div>
      </div>)}
      <div className="nc-hero__portal" aria-hidden="true" />
      <CardConnectionStory Action={Action}>
        <div className="nc-hero__card"><div className="nc-hero__card-arrival"><IdentityCard variant="profile" interactive enabled={reduced || cardReady} /></div></div>
      </CardConnectionStory>
    </div>
  </section><div ref={exitSpace} className="nc-connection-exit" aria-hidden="true" /></>
}

export function CinematicComparison({ Action }) {
  const { t }=useTranslation('businessCards')
  const sides=t('comparison.sides',{returnObjects:true})
  return <section className="nc-comparison" aria-labelledby="nc-comparison-title">
    <div className="nc-comparison__heading">
      <EditorialTitle id="nc-comparison-title" text={t('cinematic.comparisonLead')} />
    </div>
    <div className="nc-comparison__grid">
      {sides.map((side,i)=><article className={`nc-compare nc-compare--${i?'live':'paper'}`} key={side.id}>
        <div className="nc-compare__copy">
          <div className="nc-compare__header">
            <h3>{side.title}</h3>
            <span className={`nc-compare__header-icon${i === 0 ? ' nc-compare__header-icon--close' : ''}`} aria-hidden="true">
              {i === 1 && <ChevronRight />}
            </span>
          </div>
          <ul>{side.items.map(item=><li key={item}>{item}</li>)}</ul>
          {i === 1 && <Action href={APP_URL}>{t('comparison.cta')}</Action>}
        </div>
      </article>)}
    </div>
  </section>
}

export function CinematicJourney({ Action }) {
  const {t}=useTranslation('businessCards')
  const reduced=useReducedMotion()
  const root=useRef(null)
  const [step,setStep]=useState(0)
  const [theme,setTheme]=useState('paper')
  const [desktop,setDesktop]=useState(false)
  const steps=t('journey.steps',{returnObjects:true})
  const {scrollYProgress}=useScroll({target:root,offset:['start start','end end']})
  useEffect(()=>{
    const query=window.matchMedia('(min-width: 900px) and (min-height: 650px)')
    const update=()=>setDesktop(query.matches)
    update();query.addEventListener('change',update)
    return ()=>query.removeEventListener('change',update)
  },[])
  useEffect(()=>{
    if(reduced||!desktop)return
    return scrollYProgress.on('change',v=>setStep(Math.min(2,Math.floor(v*3))))
  },[scrollYProgress,reduced,desktop])
  const select=(index)=>{
    setStep(index)
    if(desktop&&!reduced&&root.current){
      const top=root.current.getBoundingClientRect().top+window.scrollY
      window.scrollTo({top:top+(root.current.offsetHeight-window.innerHeight)*(index/3+0.07),behavior:'instant'})
    }
  }
  const handleKeys=(event,index)=>{
    let next=index
    if(event.key==='ArrowRight'||event.key==='ArrowDown') next=(index+1)%3
    else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index+2)%3
    else if(event.key==='Home')next=0
    else if(event.key==='End')next=2
    else return
    event.preventDefault();select(next)
    root.current.querySelector(`#nc-step-${next}`).focus({preventScroll:true})
  }
  return <section ref={root} className={`nc-journey${reduced?' nc-journey--reduced':''}`} id="how-it-works" aria-labelledby="nc-journey-title">
    <div className="nc-journey__sticky">
      <div className="nc-journey__heading"><EditorialTitle id="nc-journey-title" text={t("journey.eyebrow")} /></div>
      <div className="nc-journey__layout">
        <div className="nc-journey__editorial">
          <h3>{t("journey.title")}</h3>
          <div className="nc-journey__tabs bc2-journey__steps" role="tablist" aria-orientation={desktop ? "vertical" : "horizontal"} aria-label={t('journey.title')}>{steps.map((s,i)=><button role="tab" type="button" id={`nc-step-${i}`} aria-controls="nc-journey-panel" aria-selected={step===i} tabIndex={step===i?0:-1} key={s.id} onClick={()=>select(i)} onKeyDown={e=>handleKeys(e,i)}><span>0{i+1}</span><span>{s.title}</span><i/></button>)}</div>
          <div id="nc-journey-panel" role="tabpanel" tabIndex={0} aria-labelledby={`nc-step-${step}`}>
            <motion.div key={step} initial={reduced?false:{y:15,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:0.45,ease:EASE}}><p className="nc-journey__description">{steps[step].description}</p><span className="nc-journey__detail">{t(`cinematic.stepNotes.${step}`)}</span></motion.div>
          </div>
          <Action className="nc-journey__cta" href={APP_URL}>{t('hero.cta')}</Action>
        </div>
        <div className={`nc-journey__demo nc-journey__demo--${step}`}>
          <div className="nc-journey__demo-top"><span>{t('cinematic.livePreview')}</span><span>0{step+1} / 03</span></div>
          <div className="nc-journey__orbit" aria-hidden="true"><i/><i/></div>
          {step !== 2 && <div className="nc-journey__identity"><IdentityCard theme={theme}/></div>}
          <div className="nc-journey__scan" aria-hidden="true"><i/><span>{t('cinematic.scanning')}</span></div>
          <div className="nc-journey__contacts" aria-hidden={step!==2}>{[meetingPhoto,eventPhoto,portrait].map((photo,i)=><div key={photo}><img src={photo} alt=""/><span>{t(`cinematic.contacts.${i}`)}</span><ChevronRight /></div>)}</div>
          <div className="nc-journey__customizer" inert={step!==0?'':undefined} aria-hidden={step!==0}><span>{t('cinematic.chooseColor')}</span><div>{['paper','olive','rust'].map(color=><button key={color} type="button" className={`nc-swatch nc-swatch--${color}`} aria-label={t(`cinematic.colors.${color}`)} aria-pressed={theme===color} onPointerEnter={(event)=>{ if(event.pointerType==='mouse') setTheme(color) }} onFocus={()=>setTheme(color)} onClick={()=>setTheme(color)} />)}</div></div>
          <div className="nc-journey__success" aria-hidden={step!==2}><span>✓</span>{t('cinematic.saved')}</div>
        </div>
      </div>
      <div className="nc-journey__meter" aria-hidden="true"><motion.i style={desktop&&!reduced?{scaleX:scrollYProgress}:{scaleX:(step+1)/3}}/></div>
    </div>
  </section>
}

export function ConnectionRibbon() {
  const {t}=useTranslation('businessCards')
  const reduced=useReducedMotion()
  const root=useRef(null)
  const {scrollYProgress}=useScroll({target:root,offset:['start end','end start']})
  const x=useTransform(scrollYProgress,[0,1],['8%','-18%'])
  return <div ref={root} className="nc-ribbon" aria-hidden="true"><motion.div style={reduced?undefined:{x}}>{[0,1,2].map(i=><span key={i}>{t('cinematic.ribbon')} <i><ChevronRight /></i> </span>)}</motion.div></div>
}

export function useCinematicTransitions(root, language) {
  const reduced=useReducedMotion()
  useLayoutEffect(()=>{
    const themeContext=gsap.context(()=>{
      ScrollTrigger.create({trigger:'.nc-hero',start:()=>{
        const hero = root.current.querySelector('.nc-hero')
        const stage = hero.querySelector('.nc-hero__stage')
        const offset = hero.dataset.connectionMotion === 'static'
          ? hero.querySelector('.nc-hero__intro').offsetHeight - 45
          : (hero.offsetHeight - window.innerHeight) * HERO_PORTAL_COMPLETE / HERO_TIMELINE_LENGTH
        return `top -${offset}`
      },endTrigger:'.nc-comparison',end:()=>`top ${window.innerWidth < 768 ? 36 : 45}px`,toggleClass:{
        // Inline/floating transitions remount the header. Keep its contrast
        // theme on the stable shell so both modes inherit the current surface.
        targets:root.current.querySelector('.bc2-header-shell'),className:'bc2-header--dark'
      }})
    },root)
    if(reduced)return ()=>themeContext.revert()
    const media=gsap.matchMedia()
    media.add('(min-width: 900px)',()=>{
      const ctx=gsap.context(()=>{
        gsap.fromTo('.bc2-platform__panel',{scale:0.88},{scale:1,ease:'none',scrollTrigger:{trigger:'.bc2-platform',start:'top 90%',end:'top 15%',scrub:0.6}})
        gsap.fromTo('.bc2-final__copy',{y:90},{y:-25,ease:'none',scrollTrigger:{trigger:'.bc2-final',start:'top bottom',end:'bottom bottom',scrub:true}})
        gsap.fromTo('.bc2-footer__wordmark',{yPercent:50},{yPercent:0,ease:'none',scrollTrigger:{trigger:'.bc2-footer',start:'top bottom',end:'bottom bottom',scrub:true}})
      },root)
      return ()=>ctx.revert()
    })
    scheduleScrollRefresh()
    return ()=>{media.revert();themeContext.revert()}
  },[reduced,language,root])
}
