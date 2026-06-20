interface InfoCard {
  title: string;
  body: string;
}

const CARDS: InfoCard[] = [
  {
    title: 'Raw EEG signal',
    body: 'The wavy line is the brain’s electrical activity over time, measured in microvolts (µV). Each up-and-down reflects changing voltage picked up by the electrode.',
  },
  {
    title: 'FFT spectrum',
    body: 'The FFT breaks the signal into the frequencies it contains. Tall peaks mean that rhythm is strong in the current window. The X axis is frequency (Hz), the Y axis is magnitude.',
  },
  {
    title: 'Frequency bands',
    body: 'EEG rhythms are grouped into bands: Delta (0.5–4Hz), Theta (4–8Hz), Alpha (8–13Hz), Beta (13–30Hz) and Gamma (30–50Hz). Different bands dominate in different mental and sleep states.',
  },
  {
    title: 'Sleep stages',
    body: 'Wake: awake/alert. N1: light drowsy sleep. N2: stable light sleep (spindles). N3: deep slow-wave sleep (lots of Delta). REM: dreaming sleep with brain activity close to wake.',
  },
  {
    title: 'Why small windows?',
    body: 'EEG changes second to second, so we analyze short windows (e.g. 5–30s). A short slice keeps the spectrum meaningful; averaging hours together would blur these fast changes.',
  },
  {
    title: 'Educational use only',
    body: 'This tool is for learning and research exploration of EEG signals. It does not perform clinical diagnosis, sleep scoring, or any “dream decoding”.',
  },
];

/** Friendly explanations shown beneath the charts. */
export function EducationCards() {
  return (
    <section className="education">
      <h2 className="education__title">Understanding what you see</h2>
      <div className="education__grid">
        {CARDS.map((c) => (
          <article key={c.title} className="info-card">
            <h3>{c.title}</h3>
            <p>{c.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
