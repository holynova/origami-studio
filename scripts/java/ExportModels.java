// Model export adapter for Paper in Motion, modified 2026-10-22.
// GPL-3.0; geometry engine and example files by Attila Bágyoni.
import java.nio.file.*;
import java.io.*;
import java.util.*;
import origamieditor3d.origami.*;
import origamieditor3d.io.*;
public class ExportModels {
 static String arr(double[] a,int n){StringJoiner j=new StringJoiner(",","[","]");for(int i=0;i<n;i++)j.add(String.format(Locale.US,"%.7f",Math.abs(a[i])<1e-8?0:a[i]));return j.toString();}
 static double cross(double[] a,double[] b,double[] c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
 static double[] image(Origami m,double[] uv){
  double best=-1e99;double[] answer=null;
  for(List<Integer> poly:m.getPolygons())for(int i=1;i+1<poly.size();i++){
   int ai=poly.get(0),bi=poly.get(i),ci=poly.get(i+1);double[] a=m.getVertices2d().get(ai),b=m.getVertices2d().get(bi),c=m.getVertices2d().get(ci);double det=cross(a,b,c);if(Math.abs(det)<1e-7)continue;
   double v=cross(a,uv,c)/det,w=cross(a,b,uv)/det,u=1-v-w;double inside=Math.min(u,Math.min(v,w));
   if(inside>best){best=inside;answer=new double[3];for(int k=0;k<3;k++)answer[k]=u*m.getVertices().get(ai)[k]+v*m.getVertices().get(bi)[k]+w*m.getVertices().get(ci)[k];}
   if(inside>=-1e-6)return answer;
  }
  if(answer==null||best<-.01)throw new RuntimeException("Cannot project paper coordinate "+arr(uv,2)+" "+best);
  return answer;
 }
 public static void main(String[] args)throws Exception{
  for(String name:new String[]{"crane","boat","airplane","butterfly","frog"}){
   Origami model=OrigamiIO.read_gen2(new ByteArrayInputStream(Files.readAllBytes(Path.of("scripts/models/"+name+".ori"))),null);
   List<Origami.FoldingAction> history=new ArrayList<>(model.getHistory());model.undo(model.getHistoryPointer());
   StringJoiner steps=new StringJoiner(",","[","]");int folds=0;double error=0;
   for(int hi=0;hi<history.size();hi++){
    Origami.FoldingAction act=history.get(hi);if(act.foldID>=6)throw new RuntimeException(name+" includes a cut!");
    Origami before=model.copy();model.redo(1);
    if(act.foldID==5)continue;
    StringJoiner faces=new StringJoiner(",","[","]");double motion=0;
    for(List<Integer> poly:model.getPolygons()){
     if(poly.size()<3)continue;
     StringJoiner uv=new StringJoiner(",","[","]"),start=new StringJoiner(",","[","]"),end=new StringJoiner(",","[","]");List<double[]> starts=new ArrayList<>(),ends=new ArrayList<>();double area=0;
     for(int idx:poly){double[] flat=model.getVertices2d().get(idx),s=image(before,flat),e=model.getVertices().get(idx);uv.add(arr(flat,2));start.add(arr(s,3));end.add(arr(e,3));starts.add(s);ends.add(e);for(int k=0;k<3;k++)motion+=Math.abs(s[k]-e[k]);}
     for(int i=1;i+1<poly.size();i++)area+=Math.abs(cross(model.getVertices2d().get(poly.get(0)),model.getVertices2d().get(poly.get(i)),model.getVertices2d().get(poly.get(i+1))));
     if(area<1e-5)continue;
     for(int i=0;i<starts.size();i++)for(int j=i+1;j<starts.size();j++){double ds=0,de=0;for(int k=0;k<3;k++){ds+=Math.pow(starts.get(i)[k]-starts.get(j)[k],2);de+=Math.pow(ends.get(i)[k]-ends.get(j)[k],2);}error=Math.max(error,Math.abs(Math.sqrt(ds)-Math.sqrt(de)));}
     faces.add("{\"uv\":"+uv+",\"a\":"+start+",\"b\":"+end+"}");
    }
    if(motion>1e-5){folds++;steps.add("{\"op\":"+act.foldID+",\"plane\":"+arr(act.ppoint,3)+",\"normal\":"+arr(act.pnormal,3)+",\"angle\":"+act.phi+",\"faces\":"+faces+"}");}
   }
   StringJoiner corners=new StringJoiner(",","[","]");for(double[] c:model.getCorners())corners.add(arr(c,2));
   String out="{\"name\":\""+name+"\",\"corners\":"+corners+",\"steps\":"+steps+"}";
   Files.writeString(Path.of("dist/models/"+name+".json"),out);System.out.println(name+": "+folds+" folds, "+out.length()+" bytes, max edge delta="+error);
  }
 }
}
