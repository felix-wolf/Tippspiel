import { Menu, MenuItem, Sidebar } from "react-pro-sidebar";
import { Link } from "react-router-dom";
import React from "react";

type MenuPageProps = React.PropsWithChildren<{}>;

export function MenuPage({ children }: MenuPageProps) {
  return (
    <>
      <Sidebar collapsed={true}>
        <Menu
          menuItemStyles={{
            button: {
              // the active class will be added automatically by react router
              // so we can use it to style the active menu item
              [`&.active`]: {
                backgroundColor: "#13395e",
                color: "#b6c8d9",
              },
            },
          }}
        >
          <MenuItem component={<Link to="/documentation" />}>
            {" "}
            Documentation
          </MenuItem>
          <MenuItem component={<Link to="/calendar" />}> Calendar</MenuItem>
          <MenuItem component={<Link to="/e-commerce" />}> E-commerce</MenuItem>
        </Menu>
      </Sidebar>
      {children}
    </>
  );
}
