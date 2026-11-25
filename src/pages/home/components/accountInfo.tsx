import {RiUserLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {Me} from "../../../client/resources/index.js";
import {QueryState} from "../../../components/queryState.js";
import InfoTile from "../../../components/infoTile.js";
import Display from "../../../lib/display.js";

const AccountInfo = () => {
  const {t} = useTranslation("landing");
  return (
    <QueryState query={Me.useQuery()}>
      {me => (
        <InfoTile icon={<RiUserLine/>} title={t("blocks.student")}>
          {Display.fullName(me.account)} <span className="font-normal text-base-content/60">({me.account.login})</span>
        </InfoTile>
      )}
    </QueryState>
  );
};

export default AccountInfo;
