import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CrudItem {
  id: number;
  nombre: string;
  subtitulo?: string; // ej: "Categoría: Servicios" en subcategorías
  descripcion?: string;
}

interface CrudListProps {
  title: string;
  buttonLabel: string;
  items: CrudItem[];
  onNew: () => void;
  onEdit: (item: CrudItem) => void;
  onDelete: (id: number) => void;
}

export function CrudList({
  title,
  buttonLabel,
  items,
  onNew,
  onEdit,
  onDelete,
}: CrudListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button onClick={onNew} className="bg-[#002868] hover:bg-[#003d8f]">
          + {buttonLabel}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div>
                <h3 className="font-semibold text-[#002868]">{item.nombre}</h3>
                {item.subtitulo && (
                  <p className="text-xs text-[#666666]">{item.subtitulo}</p>
                )}
                {item.descripcion && (
                  <p className="text-sm text-[#666666] mt-1">
                    {item.descripcion}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => onEdit(item)}
                  variant="outline"
                  size="sm"
                >
                  Editar
                </Button>
                <Button
                  onClick={() => onDelete(item.id)}
                  variant="outline"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
