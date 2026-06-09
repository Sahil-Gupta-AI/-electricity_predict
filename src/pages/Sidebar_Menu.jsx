import { Link } from "react-router-dom";
import "../styles/Sidebar_Menu.css";
import { House } from "lucide-react";
import { Book } from "lucide-react";
import { ListVideo } from "lucide-react";
import { FileUser } from "lucide-react";
import { Lightbulb } from "lucide-react";
import { UserPen } from "lucide-react";
import { LogOut } from "lucide-react";

export default function Sidebar_Menu({ collapsed, setCollapsed }) {
return (
  <>
      <aside className={`Sidebar ${collapsed ? "collapsed" : ""}`}>
              <div className="sidebar-header">
                  <img className="logo-pic" src="./logo.png" />
              </div>

              <ul>
                  <li>
                      <a>
                          <House className="logo-button" /> {!collapsed && <span>Dashboard{" "}</span>}
                      </a>
                  </li>
                  <li>
                      <a>
                          <Book className="logo-button" /> {!collapsed && <span>Predict Bills{" "}</span>}
                      </a>
                  </li>
                  <li>
                      <a>
                          <ListVideo className="logo-button" /> {!collapsed && <span>Bill
                          History{" "}</span>}
                      </a>
                  </li>
                  <li>
                      <a>
                          <FileUser className="logo-button" /> {!collapsed && <span>Consumption
                          History{" "}</span>}
                      </a>
                  </li>
                  <li>
                      <a>
                          <Lightbulb className="logo-button" /> {!collapsed && <span>Tips & Suggestions{" "}</span>}
                      </a>
                  </li>
                  <li>
                      <a>
                          <UserPen className="logo-button" /> {!collapsed && <span>Profile{" "}</span>}
                      </a>
                  </li>
                  <li>
                      <a>
                          <LogOut className="logo-button" /> {!collapsed && <span>Logout{" "}</span>}
                      </a>
                  </li>
              </ul>
          </aside>
 </>

    );
      }