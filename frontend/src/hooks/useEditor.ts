import EditorContext from "@/contexts/EditorContext";
import { useContext } from "react";

export const useEditor = () => useContext(EditorContext);
