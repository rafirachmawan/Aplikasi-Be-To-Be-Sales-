// apps/mobile/App.tsx
import React, { useState } from "react";
import { StatusBar, View } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import HeaderSeam from "./src/components/HeaderSeam"; // jika dipakai di beberapa screen
import TopTabs from "./src/components/TopTabs";

import Home from "./src/screens/Home";
import VisitCreate from "./src/screens/VisitCreate";
import PlanTomorrow from "./src/screens/PlanTomorrow";
import History from "./src/screens/History";
import CustomerMaster from "./src/screens/CustomerMaster";

import type { NavTo } from "./src/types/nav";
import { theme } from "./src/theme";

type Page = "home" | "visit" | "plan" | "history" | "customers";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const go: NavTo = (p) => setPage(p);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          {page === "home" && <Home go={go} />}
          {page === "visit" && <VisitCreate go={go} />}
          {page === "plan" && <PlanTomorrow go={go} />}
          {page === "history" && <History go={go} />}
          {page === "customers" && <CustomerMaster go={go} />}
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
