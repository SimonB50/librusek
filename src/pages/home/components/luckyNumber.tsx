import {RiSparklingLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {LuckyNumber as LuckyNumberResource} from "../../../client/resources/index.js";
import {QueryState} from "../../../components/queryState.js";
import InfoTile from "../../../components/infoTile.js";
import DateUtils from "../../../lib/date.js";

const LuckyNumber = () => {
  const {t} = useTranslation("landing");
  return (
    <QueryState query={LuckyNumberResource.useQuery()}>
      {data => (
        <InfoTile icon={<RiSparklingLine/>} title={t("blocks.lucky_number.title")}>
          <span className="text-primary text-2xl">{data.luckyNumber}</span>{" "}
          <span className="font-normal text-base-content/60">({DateUtils.weekday(data.luckyNumberDay)}, {DateUtils.formatDate(data.luckyNumberDay)})</span>
        </InfoTile>
      )}
    </QueryState>
  );
};

export default LuckyNumber;
