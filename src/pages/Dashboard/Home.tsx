import EcommerceMetrics from "../../components/chart/Metrics";
import MonthlySalesChart from "../../components/chart/MonthlySalesChart";
import StatisticsChart from "../../components/chart/StatisticsChart";
import MonthlyTarget from "../../components/chart/MonthlyTarget";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta title="Dashboard - Haui Tư Vấn Tuyển Sinh" description="" />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />

          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>
      </div>
    </>
  );
}
