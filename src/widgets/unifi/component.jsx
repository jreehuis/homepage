import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import { useTranslation } from "next-i18next";

import useWidgetAPI from "utils/proxy/use-widget-api";

export default function Component({ service }) {
  const { t } = useTranslation();

  const { widget } = service;

  const { data: statsData, error: statsError } = useWidgetAPI(widget, "stat/sites");

  if (statsError) {
    return <Container service={service} error={statsError} />;
  }

  const defaultSite = widget.site
    ? statsData?.data.find((s) => s.desc === widget.site)
    : statsData?.data?.find((s) => s.name === "default");

  if (!defaultSite) {
    if (widget.site) {
      return <Container service={service} error={{ message: `Site '${widget.site}' not found` }} />;
    }

    return (
      <Container service={service}>
        <Block label="unifi.uptime" />
        <Block label="unifi.wan" />
        <Block label="unifi.lan_users" />
        <Block label="unifi.wlan_users" />
      </Container>
    );
  }

  const wan = defaultSite.health.find((h) => h.subsystem === "wan");
  const lan = defaultSite.health.find((h) => h.subsystem === "lan");
  const wlan = defaultSite.health.find((h) => h.subsystem === "wlan");

  const uptime = wan["gw_system-stats"]
    ? `${t("common.number", { value: wan["gw_system-stats"].uptime / 86400, maximumFractionDigits: 1 })} ${t(
        "unifi.days",
      )}`
    : null;


  // Provide a default if not set in the config
  if (!widget.fields) {
    widget.fields = ["uptime", "wan", "lan_users", "wlan_users", "lan_devices", "wlan_devices", "lan", "wlan"];
  }
  // Filter out unavailable information
  widget.fields = widget.fields.filter((field) => {
    switch(field) {
      case "uptime":
      case "wan":
        return wan.status !== "unknown";
      case "lan":
      case "lan_users":
      case "lan_devices":
        return lan.status !== "unknown";
      case "wlan":
      case "wlan_users":
      case "wlan_devices":
        return wlan.status !== "unknown";
      default:
        return false;
    }
  });
  // Limit to a maximum of 4 at a time
  if (widget.fields.length > 4) {
    widget.fields = widget.fields.slice(0, 4);
  }

  if (widget.fields.length < 1){
    return (
      <Container service={service}>
        <Block value={t("unifi.empty_data")} />
      </Container>
    );
  }

  return (
    <Container service={service}>
      <Block label="unifi.uptime" value={uptime} />
      <Block label="unifi.wan" value={wan.status === "ok" ? t("unifi.up") : t("unifi.down")} />

      <Block label="unifi.lan_users" value={t("common.number", { value: lan.num_user })} />
      <Block label="unifi.lan_devices" value={t("common.number", { value: lan.num_adopted })} />
      <Block label="unifi.lan" value={lan.up ? t("unifi.up") : t("unifi.down")} />

      <Block label="unifi.wlan_users" value={t("common.number", { value: wlan.num_user })} />
      <Block label="unifi.wlan_devices" value={t("common.number", { value: wlan.num_adopted })} />
      <Block label="unifi.wlan" value={wlan.up ? t("unifi.up") : t("unifi.down")} />
    </Container>
  );
}
