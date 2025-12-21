import { useQuery } from '@tanstack/react-query';

// Temporary useAdminModules stub
export interface Module {
    id: string;
    name: string;
    enabled: boolean;
}

export function useAdminModules() {
    return useQuery({
        queryKey: ['admin-modules'],
        queryFn: async () => {
            // TODO: Implementar llamada real al backend
            const modules: Module[] = [];
            return modules;
        },
    });
}
