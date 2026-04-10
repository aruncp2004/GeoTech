import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { Sample, SampleStatus, SampleCondition } from "@/types";

export function useSamples() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: samples = [], isLoading } = useQuery({
    queryKey: ["samples", user?.id, user?.role],
    queryFn: async () => {
      let query = supabase
        .from("samples")
        .select("*, profiles(full_name, company)")
        .order("created_at", { ascending: false });

      if (user?.role === "customer") {
        query = query.eq("customer_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Sample[];
    },
    enabled: !!user,
  });

  const { data: sample, isLoading: isSampleLoading } = useQuery({
    queryKey: ["sample"],
    queryFn: async () => null,
    enabled: false,
  });

  const fetchSampleById = async (id: string) => {
    const { data, error } = await supabase
      .from("samples")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("fetchSampleById error:", error);
      throw error;
    }
    return data as Sample;
  };

  const createSample = useMutation({
  mutationFn: async (
    newSample: Omit<Sample, "id" | "created_at" | "customer_name" | "customer_company">,
  ) => {
    const { data, error } = await supabase
      .from("samples")
      .insert(newSample)
      .select()
      .single();
    if (error) {
      console.error("createSample error:", error);
      throw error;
    }
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["samples"] });
  },
});

  const updateSample = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<{
        status: SampleStatus;
        condition: SampleCondition;
        notes: string;
        awb_number: string;
        courier_name: string;
        received_at: string;
      }>;
    }) => {
      const { data, error } = await supabase
        .from("samples")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
    },
  });

  return {
    samples,
    sample,
    isLoading,
    isSampleLoading,
    fetchSampleById,
    createSample,
    updateSample,
  };
}
