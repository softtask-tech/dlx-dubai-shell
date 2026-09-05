import {
  TOO_FEW_RECORDS,
  formatPeriod,
  sourceLine,
  type MarketRow,
} from "@/data/market-public";

/**
 * Registered sale activity for one project or one developer.
 *
 * Deliberately narrow: a count of registered sale transactions, the periods it
 * covers, and a sentence saying what it is not. The Dubai Land Department
 * records that a sale happened, not whether it was a good one, so the module
 * states plainly that recorded activity is not a measure of quality or of
 * returns and does not rank anybody against anybody else.
 *
 * The entity is matched on its official public number and nothing else. There
 * is no name matching here, so a module either belongs to this record or it
 * does not appear at all.
 */
export function RecordedActivity({
  rows,
  subject,
  sourceExportDate,
}: {
  rows: readonly MarketRow[];
  subject: "project" | "developer";
  sourceExportDate: string | null;
}) {
  const years = [...rows].sort((a, b) => b.period_start.localeCompare(a.period_start)).slice(0, 6);
  const total = years.reduce((sum, row) => sum + row.metric_value, 0);

  return (
    <section className="mt-14 border-t border-border pt-10">
      <h2 className="display-3">Recorded transaction activity</h2>
      <p className="body-text mt-5 max-w-measure text-muted-foreground">
        Registered sale transactions recorded against this {subject} in Dubai Land Department open
        data, matched on its official number. Recorded activity is a count of registrations. It is
        not a measure of quality, performance or returns, and it is not a ranking.
      </p>

      {years.length === 0 ? (
        <p className="body-text mt-8 max-w-measure">{TOO_FEW_RECORDS}</p>
      ) : (
        <>
          <p className="display-3 mt-8">{Math.round(total).toLocaleString("en-AE")}</p>
          <p className="caption mt-2">
            Registered sale transactions across the {years.length} published{" "}
            {years.length === 1 ? "year" : "years"} below
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[24rem] border-collapse">
              <caption className="caption pb-4 text-left">
                Registered sale transactions by year, with the number of registered records behind
                each figure.
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="eyebrow py-3 pr-6 text-left font-normal">
                    Year
                  </th>
                  <th scope="col" className="eyebrow py-3 pr-6 text-left font-normal">
                    Registered sale transactions
                  </th>
                  <th scope="col" className="eyebrow py-3 text-left font-normal">
                    Records
                  </th>
                </tr>
              </thead>
              <tbody>
                {years.map((row) => (
                  <tr key={row.aggregate_key} className="border-b border-border/60">
                    <th scope="row" className="caption py-3 pr-6 text-left font-normal">
                      {formatPeriod("year", row.period_start)}
                    </th>
                    <td className="caption py-3 pr-6">
                      {Math.round(row.metric_value).toLocaleString("en-AE")}
                    </td>
                    <td className="caption py-3">
                      {row.observation_count.toLocaleString("en-AE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="caption mt-8 max-w-measure">{sourceLine(sourceExportDate)}</p>
    </section>
  );
}
