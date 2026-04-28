import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button"

const SearchBar = ({
    value = "",
    onChange,
    onSubmit,
    placeholder = "Buscar material...",
    className = "",
    inputClassName = "",
    showFilterButton = false,
    onFilterClick,
}) => {
    const handleInputChange = (e) => {
        onChange?.(e.target.value);
    };

    const handleClear = () => {
        onChange?.("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit?.(value);
    };

    return (
        <div className="bg-white shadow-sm border-b sticky top-16 sm:top-28 z-30">
            <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4">
                <form className="flex items-center gap-3" onSubmit={handleSubmit}>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder={placeholder}
                            value={value}
                            onChange={handleInputChange}
                            className="pl-10 pr-10 py-2 border-gray-200 focus:border-blue-500 rounded-lg"
                        />
                        {value && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Limpiar búsqueda"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Buscar
                    </Button>
                    {showFilterButton && (
                        <GlassButton
                            type="button"
                            variant="outline"
                            onClick={onFilterClick}
                            className="flex items-center gap-2 lg:hidden"
                        >
                            <Filter className="w-4 h-4" />
                            Filtros
                        </GlassButton>
                    )}
                </form>
    </div>
</div>
    );
}

export default SearchBar;