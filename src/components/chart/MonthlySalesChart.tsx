import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import axiosConfig from "../../axios/config";

interface MonthlyConsultation {
  month: number;
  count: number;
}

const months = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const getYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= 2020; i--) {
    years.push(i);
  }
  return years;
};

const fetchMonthlyConsultations = async (
  year: number
): Promise<MonthlyConsultation[]> => {
  const { data } = await axiosConfig.get(
    "/api/analytics/consultations/monthly",
    {
      params: { year },
    }
  );
  return data;
};

export default function MonthlyConsultationsChart() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data, isLoading, isError, error } = useQuery<
    MonthlyConsultation[],
    Error
  >({
    queryKey: ["monthlyConsultations", selectedYear],
    queryFn: () => fetchMonthlyConsultations(selectedYear),
  });

  const years = getYears();
  const seriesData = data?.map((item) => item.count) || [];

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: months,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: false,
    },

    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) => `${val} yêu cầu`,
      },
    },
  };

  const series = [
    {
      name: `Yêu cầu tư vấn năm ${selectedYear}`,
      data: seriesData,
    },
  ];

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-red-500">Lỗi: {error.message}</div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Yêu cầu tư vấn hàng tháng
        </h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            {years.map((year) => (
              <DropdownItem
                key={year}
                onItemClick={() => {
                  setSelectedYear(year);
                  closeDropdown();
                }}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Năm {year}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </div>
      <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
        Tổng số yêu cầu: {seriesData.reduce((sum, current) => sum + current, 0)}
      </p>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}
