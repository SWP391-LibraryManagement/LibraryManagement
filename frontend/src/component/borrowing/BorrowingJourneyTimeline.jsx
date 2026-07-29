import { fmtDate } from '../../utils/libraryFeatureViewModels';
import { buildBorrowingJourney } from '../../utils/borrowingJourney';

export default function BorrowingJourneyTimeline({ row }) {
  const journey = buildBorrowingJourney(row);

  return (
    <ol className="borrow-journey" aria-label={`Hành trình ${row.title}`}>
      {journey.map((item) => (
        <li
          key={item.key}
          className={`borrow-journey__step is-${item.state}`}
          aria-current={item.state === 'current' ? 'step' : undefined}
        >
          <span className="borrow-journey__marker" aria-hidden="true" />
          <strong>{item.label}</strong>
          {item.at && <time dateTime={item.at}>{fmtDate(item.at)}</time>}
        </li>
      ))}
    </ol>
  );
}
