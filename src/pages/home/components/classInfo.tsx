import {RiGroupLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {Class} from "../../../client/resources/index.js";
import {QueryState} from "../../../components/queryState.js";
import InfoTile from "../../../components/infoTile.js";

const ClassInfo = () => {
  const {t} = useTranslation("landing");
  return (
    <QueryState query={Class.useQuery()}>
      {data => {
        const endYear = Number.parseInt(data.endSchoolYear.split("-")[0], 10);
        return (
          <InfoTile icon={<RiGroupLine/>} title={t("blocks.class")}>
            {data.number}{data.symbol} <span className="font-normal text-base-content/60">({endYear - data.number}-{endYear})</span>
          </InfoTile>
        );
      }}
    </QueryState>
  );
};

export default ClassInfo;
