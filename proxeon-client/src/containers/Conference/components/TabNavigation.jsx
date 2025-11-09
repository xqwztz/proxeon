import React, { useState } from "react";
import NavigationComponents from "./tabNavigationComponents/index";
import { TabContent, TabPane, Nav, NavItem, NavLink } from "reactstrap";
import classnames from "classnames";

export default function TabNavigation(props) {
  const [activeTab, setActiveTab] = useState("1");

  const toggle = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  return (
    <div className="d-flex flex-column tabs-container">
      <Nav tabs>
        <NavItem>
          <NavLink
            className={classnames({ active: activeTab === "1" })}
            onClick={() => {
              toggle("1");
            }}
          >
            Nagrania z pokoju
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={classnames({ active: activeTab === "2" })}
            onClick={() => {
              toggle("2");
            }}
          >
            Aktywni użytkownicy
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent activeTab={activeTab}>
        <TabPane tabId="1">
          <NavigationComponents.Recordings selected={props.selected} />
        </TabPane>
        <TabPane tabId="2">
          <NavigationComponents.ActiveUsers selected={props.selected} />
        </TabPane>
      </TabContent>
    </div>
  );
}
