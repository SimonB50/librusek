import {RiBuilding2Line} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {School} from "../../../client/resources/index.js";
import {QueryState} from "../../../components/queryState.js";
import InfoTile from "../../../components/infoTile.js";

const SchoolInfo = () => {
  const {t} = useTranslation("landing");
  return (
    <QueryState query={School.useQuery()}>
      {school => (
        <InfoTile icon={<RiBuilding2Line/>} title={t("blocks.school")} hint={school.name}>
          {school.name}
        </InfoTile>
      )}
    </QueryState>
  );
};

export default SchoolInfo;
