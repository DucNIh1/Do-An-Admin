import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import axiosConfig from "../../axios/config";

interface MonthlyData {
  month: string;
  count: number;
}

interface AnalyticsData {
  monthlyData: MonthlyData[];
  totalUsers: number;
}

const fetchMonthlyRegistrations = async (
  year: number
): Promise<AnalyticsData> => {
  const { data } = await axiosConfig.get(
    "/api/analytics/registrations/monthly",
    {
      params: { year },
    }
  );
  return data;
};

const getYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= 2020; i--) {
    years.push(i);
  }
  return years;
};

export default function MonthlyTarget() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data, isLoading, isError, error } = useQuery<AnalyticsData, Error>({
    queryKey: ["monthlyRegistrations", selectedYear],
    queryFn: () => fetchMonthlyRegistrations(selectedYear),
  });

  const years = getYears();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Lỗi: {error.message}
      </div>
    );
  }

  const { monthlyData, totalUsers } = data || {
    monthlyData: [],
    totalUsers: 0,
  };

  const currentMonthData = monthlyData[monthlyData.length - 1];
  const previousMonthData = monthlyData[monthlyData.length - 2];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 350,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: false,
        columnWidth: "45%",
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "12px",
        fontWeight: 600,
      },
    },
    xaxis: {
      categories: monthlyData.map((d) => d.month),
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      title: { text: "Số học sinh" },
    },
    fill: {
      opacity: 1,
      colors: ["#465FFF"],
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} học sinh`,
      },
    },
  };

  const series = [
    {
      name: "Số học sinh",
      data: monthlyData.map((d) => d.count),
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-6 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Số lượng học sinh
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Số lượng học sinh đăng ký trong năm {selectedYear}
            </p>
          </div>
          <div className="relative inline-block">
            <button
              className="dropdown-toggle"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
              className="w-40 p-2"
            >
              {years.map((year) => (
                <DropdownItem
                  key={year}
                  onItemClick={() => {
                    setSelectedYear(year);
                    setIsDropdownOpen(false);
                  }}
                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  Năm {year}
                </DropdownItem>
              ))}
            </Dropdown>
          </div>
        </div>

        <div className="mt-6">
          <Chart options={options} series={series} type="bar" height={350} />
        </div>

        <p className="mx-auto mt-6 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          Trong tháng này bạn đã có <b>{currentMonthData?.count || 0}</b> học
          sinh đăng ký.
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Tổng số
          </p>
          <p className="text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {totalUsers}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Tháng trước
          </p>
          <p className="text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {previousMonthData?.count || 0}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Tháng này
          </p>
          <p className="text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {currentMonthData?.count || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
