
import { GlassButton } from "@/components/ui/glass-button";
import { Filter } from "lucide-react";

const FilterButton = ({setShowFilters}) => (
<GlassButton
    onClick={() => setShowFilters(true)}
    className="fixed z-40 bottom-20 right-4 h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center md:hidden"
    aria-label="Filtros"
>
    <Filter className="h-5 w-5 text-white" />
</GlassButton>
);

export default  FilterButton;