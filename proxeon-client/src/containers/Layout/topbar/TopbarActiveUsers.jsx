import React, { PureComponent } from "react";
import { withTranslation } from "react-i18next";
import { Link } from "react-router-dom";

class TopbarActiveUsers extends PureComponent {
  render() {
    const { t } = this.props;
    return (
      <div className="topbar__profile">
        <Link to="/activeUsers">
          <button
            type="button"
            className="topbar__avatar"
            style={{ alignItems: "center", paddingRight: "25px" }}
          >
            <p className="topbar__active-users">{t("topbar.active-users")}</p>
          </button>
        </Link>
      </div>
    );
  }
}
export default withTranslation("common")(TopbarActiveUsers);
